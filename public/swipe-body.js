// ✅ swipe-body.js — centrale integratie + loader pas weg na visuals-ready
(function () {
  console.log("🧩 swipe-body.js gestart");

  // === 1️⃣ Loader injectie + CSS (blijft hetzelfde)
  document.addEventListener("DOMContentLoaded", () => {
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
        transition: opacity 1.2s ease, visibility 1.2s ease;
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

  // === 2️⃣ Loader verbergen pas als visuals klaar of na fallback
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
    window.addEventListener("visuals:assets-ready", hideLoader);
    window.addEventListener("load", () => setTimeout(hideLoader, 1200));
  })();

  // === 3️⃣ Verberg style-/dev-elementen op live ===
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
    console.log(isEditor ? "✏️ Editor gedetecteerd — helper-elementen zichtbaar" : "✅ Alle style-/dev-elementen verborgen op live site");
  });

  // === 4️⃣ Fonts uit style-settings overnemen ===
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
    const termsRef = getComputedFontStyle("#style-settings .typo-actievoorwaarden") || bodyRef;

    const titleEl = document.getElementById("campaign-title");
    const paragraphEl = document.getElementById("campaign-paragraph");
    const actieEl = document.getElementById("actievoorwaarden");

    if (titleEl && titleRef) Object.assign(titleEl.style, titleRef);
    if (paragraphEl && bodyRef) Object.assign(paragraphEl.style, bodyRef);
    if (actieEl && termsRef) Object.assign(actieEl.style, termsRef);
  });

  // === 5️⃣ Master background ===
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
})();
