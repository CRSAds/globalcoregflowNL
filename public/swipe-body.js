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

    // === 🎨 Campagnekleur detecteren (compatibel met Swipe Pages knoppen / pseudo's) ===
window.addEventListener("load", () => {
  const scope = document.querySelector("#style-settings");
  if (!scope) {
    console.warn("⚠️ #style-settings niet gevonden — gebruik fallbackkleur");
    document.documentElement.style.setProperty("--campaign-primary", "#14B670");
    return;
  }

  // Kandidaten: id, typische Swipe classes, en algemene ankers/knoppen binnen de sectie
  const candidates = [
    "#ref-button",
    ".tatsu-btn",
    "a.tatsu-shortcode",
    ".tatsu-module a",
    "button",
    "a"
  ]
    .map(sel => scope.querySelector(sel))
    .filter(Boolean);

  // Helper: is een bruikbare, niet-transparante kleur?
  const isValid = v =>
    v &&
    v !== "transparent" &&
    v !== "rgba(0, 0, 0, 0)" &&
    v.trim() !== "";

  // Helper: haal kleur uit element (inclusief pseudo's en veelvoorkomende children)
  const getColorFromEl = el => {
    if (!el) return null;
    const order = [
      el,
      el.querySelector(".default"),
      el.querySelector("span"),
      el.querySelector("div")
    ].filter(Boolean);

    for (const node of order) {
      const cs = getComputedStyle(node);

      // 1) directe background-color
      const bg = cs.backgroundColor;
      if (isValid(bg)) return bg;

      // 2) CSS variabelen die Swipe vaak gebruikt
      const varBg = cs.getPropertyValue("--tatsu-bg-color") || cs.getPropertyValue("--button-background");
      if (isValid(varBg)) return varBg.trim();

      // 3) gradient -> pak eerste kleur
      const bgImg = cs.backgroundImage;
      if (bgImg && bgImg !== "none") {
        // zoek eerste rgba()/rgb()/#hex
        const m =
          bgImg.match(/rgba?\([^)]*\)/i) ||
          bgImg.match(/#[0-9a-f]{3,8}/i);
        if (m && isValid(m[0])) return m[0];
      }

      // 4) pseudo-elementen
      for (const pseudo of ["::before", "::after"]) {
        const ps = getComputedStyle(node, pseudo);
        if (!ps) continue;

        const pbg = ps.backgroundColor;
        if (isValid(pbg)) return pbg;

        const pVar = ps.getPropertyValue("--tatsu-bg-color");
        if (isValid(pVar)) return pVar.trim();

        const pImg = ps.backgroundImage;
        if (pImg && pImg !== "none") {
          const mm =
            pImg.match(/rgba?\([^)]*\)/i) ||
            pImg.match(/#[0-9a-f]{3,8}/i);
          if (mm && isValid(mm[0])) return mm[0];
        }
      }
    }
    return null;
  };

  let picked = null;
  for (const el of candidates) {
    picked = getColorFromEl(el);
    if (picked) break;
  }

  if (!picked) {
    // laatste redmiddel: eigen var of default
    picked = getComputedStyle(document.documentElement).getPropertyValue("--ld-primary").trim() || "#14B670";
    console.warn("⚠️ Geen knopkleur gevonden — fallback gebruikt:", picked);
  } else {
    console.log("🎨 Campagnekleur gevonden:", picked);
  }

  document.documentElement.style.setProperty("--campaign-primary", picked);
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
