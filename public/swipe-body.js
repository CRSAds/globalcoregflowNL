// ✅ swipe-body.js — loader pas weg na visuals, geen flikker, fonts & dev-elementen geregeld
(function () {
  console.log("🧩 swipe-body.js gestart");

  // === Loader-stijl + structuur ===
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

    window.addEventListener("visuals:assets-ready", hideLoader);
    window.addEventListener("load", () => setTimeout(hideLoader, 1200));

    // 🚨 Nood-fallback: forceer verwijdering na 3.5s
    setTimeout(() => {
      const loader = document.getElementById("page-loader");
      if (loader) {
        console.warn("⚠️ Visuals-event niet ontvangen — forceer loader verwijdering");
        loader.classList.add("fade-out");
        setTimeout(() => loader.remove(), 900);
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
    console.log(isEditor ? "✏️ Editor gedetecteerd — helper-secties zichtbaar" : "✅ Style/dev-secties verborgen op live site");
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

    // === 🎨 Campagnekleur detecteren uit voorbeeldknop in #style-settings (Swipe Pages compatibel) ===
window.addEventListener("load", () => {
  // Zoek in de style-settings sectie naar een knop van welk type dan ook
  const refButton =
    document.querySelector("#style-settings #ref-button") ||
    document.querySelector("#style-settings .tatsu-btn") ||
    document.querySelector("#style-settings a.tatsu-shortcode") ||
    document.querySelector("#style-settings .tatsu-module a") ||
    document.querySelector("#style-settings button");

  if (!refButton) {
    console.warn("⚠️ Geen referentieknop gevonden — gebruik standaardkleur");
    document.documentElement.style.setProperty(
      "--campaign-primary",
      getComputedStyle(document.body).getPropertyValue("--ld-primary") || "#14B670"
    );
    return;
  }

  // 1️⃣ Probeer achtergrondkleur te lezen
  const style = window.getComputedStyle(refButton);
  let bgColor =
    style.backgroundColor || style.getPropertyValue("background-color");

  // 2️⃣ Als Swipe Pages kleur via CSS-variabele heeft ingesteld, lees die ook uit
  if (
    (!bgColor || bgColor === "rgba(0, 0, 0, 0)" || bgColor === "transparent") &&
    style.getPropertyValue("--tatsu-bg-color")
  ) {
    bgColor = style.getPropertyValue("--tatsu-bg-color").trim();
  }

  // 3️⃣ Val terug op fallbackkleur
  if (!bgColor || bgColor === "rgba(0, 0, 0, 0)" || bgColor === "transparent") {
    console.warn("⚠️ Geen geldige kleur gevonden — gebruik fallback");
    bgColor = getComputedStyle(document.body).getPropertyValue("--ld-primary") || "#14B670";
  }

  document.documentElement.style.setProperty("--campaign-primary", bgColor);
  console.log("🎨 Campagnekleur ingesteld op:", bgColor);
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
})();
