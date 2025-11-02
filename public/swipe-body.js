// ✅ swipe-body.js — volledige centrale integratie voor Swipe Pages
// ---------------------------------------------------------------

(function () {
  console.log("🧩 swipe-body.js gestart");

  // === 1️⃣ Loader HTML + CSS injecteren ===
  document.addEventListener("DOMContentLoaded", () => {
    // Alleen toevoegen als hij nog niet bestaat
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

    // Injecteer de loader CSS
    const style = document.createElement("style");
    style.textContent = `
      /* === Loader overlay === */
      #page-loader {
        position: fixed;
        inset: 0;
        background: #fff;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 999999;
        opacity: 1;
        visibility: visible;
        transition: opacity 1.2s ease, visibility 1.2s ease;
      }

      #page-loader.fade-out {
        opacity: 0;
        visibility: hidden;
      }

      /* === Spinner === */
      .loader-spinner {
        width: 60px;
        height: 60px;
        border: 5px solid #ddd;
        border-top-color: #ff006e;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      .loader-inner {
        animation: loaderPulse 1.5s ease-in-out infinite;
      }

      @keyframes loaderPulse {
        0%,100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.05); opacity: 0.9; }
      }

      /* === Pagina fade-in === */
      body > :not(#page-loader) {
        opacity: 0;
        transition: opacity 0.8s ease-in-out;
      }

      body.page-loaded > :not(#page-loader) {
        opacity: 1;
      }
    `;
    document.head.appendChild(style);
  });

  // === 2️⃣ Loader fade-out bij load ===
  window.addEventListener("load", () => {
    const loader = document.getElementById("page-loader");
    if (!loader) return;

    setTimeout(() => {
      loader.classList.add("fade-out");
      setTimeout(() => {
        loader.remove();
        document.body.classList.add("page-loaded");
      }, 900);
    }, 600);
  });

  // === 3️⃣ Style-settings alleen in editor tonen ===
  window.addEventListener("load", () => {
    const el = document.getElementById("style-settings");
    if (!el) return;

    const isEditor = window.location.hostname.includes("app.swipepages.com");

    if (!isEditor) {
      el.style.display = "none";
      el.style.visibility = "hidden";
      el.style.opacity = "0";
      el.style.height = "0";
      el.style.overflow = "hidden";
      console.log("✅ #style-settings verborgen op live site");
    } else {
      console.log("✏️ Swipe Pages editor gedetecteerd — #style-settings zichtbaar");
    }
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
    const termsRef =
      getComputedFontStyle("#style-settings .typo-actievoorwaarden") || bodyRef;

    const titleEl = document.getElementById("campaign-title");
    const paragraphEl = document.getElementById("campaign-paragraph");
    const actieEl = document.getElementById("actievoorwaarden");

    if (titleEl && titleRef) Object.assign(titleEl.style, titleRef);
    if (paragraphEl && bodyRef) Object.assign(paragraphEl.style, bodyRef);
    if (actieEl && termsRef) Object.assign(actieEl.style, termsRef);

    console.log("✅ Fontstijlen toegepast vanuit #style-settings");
  });

  // === 5️⃣ Master achtergrond doorzetten ===
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
