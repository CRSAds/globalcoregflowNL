// =============================================================
// ✅ initFlow-lite.js — productieversie (globalcoregflowNL)
// =============================================================

// Debug toggle
const FLOW_DEBUG = false;
const flowLog = (...args) => { if (FLOW_DEBUG) console.log(...args); };

window.addEventListener("DOMContentLoaded", initFlowLite);

// =============================================================
// 🚫 Toegangscontrole
// =============================================================
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const status = params.get("status");

  if (status !== "online" && status !== "live") {
    document.querySelectorAll("section, footer, .sp-section, #dynamic-footer")
      .forEach(el => el.style.display = "none");

    document.body.innerHTML = `
      <style>
        html, body {
          margin: 0; padding: 0; height: 100%; overflow: hidden;
          background: #f8f8f8; display: flex; justify-content: center; align-items: center;
          font-family: Inter, Helvetica, Arial; text-align: center; color: #333;
        }
        h1 { font-size: 24px; font-weight: 600; margin-bottom: 10px; }
        p { font-size: 15px; line-height: 1.6; color: #555; }
      </style>
      <div>
        <h1>Pagina niet bereikbaar</h1>
        <p>Deze pagina is momenteel niet toegankelijk.<br>
        Controleer of je de juiste link hebt of probeer het later opnieuw.</p>
      </div>
    `;
  }
});

// =============================================================
// 🚀 Flow controller
// =============================================================
function initFlowLite() {

  const params = new URLSearchParams(window.location.search);
  const status = params.get("status") || "online";

  // Alle flow-secties
  const allSections = Array.from(document.querySelectorAll(".flow-section, .ivr-section"));
  allSections.forEach(el => el.style.display = "none");

  // Coreg container blijft zichtbaar
  const coregContainer = document.getElementById("coreg-container");
  if (coregContainer) coregContainer.style.display = "block";

  // Startsectie
  const firstVisible = allSections.find(el => !el.classList.contains("ivr-section"));
  if (firstVisible) {
    firstVisible.style.display = "block";
    reloadImages(firstVisible);
    logSectionVisible(firstVisible);
  }

  // Navigatieknoppen
  const flowButtons = document.querySelectorAll(".flow-next");
  flowButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.closest("#lead-form")) return;

      const current = btn.closest(".flow-section, .ivr-section");
      if (!current) return;

      current.style.display = "none";
      let next = current.nextElementSibling;

      // Skip IVR indien online
      while (next && next.classList.contains("ivr-section") && status === "online") {
        next = next.nextElementSibling;
      }

      // Skip longform indien niet nodig
      if (next && next.id === "long-form-section") {
        const needsLF = sessionStorage.getItem("requiresLongForm") === "true";
        if (!needsLF) next = next.nextElementSibling;
      }

      if (next) {
        next.style.display = "block";
        reloadImages(next);
        logSectionVisible(next);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  });

  // Shortform-submit event
  document.addEventListener("shortFormSubmitted", () => {
    const form = document.getElementById("lead-form");
    const current = form.closest(".flow-section");
    let next = current.nextElementSibling;

    while (next && next.classList.contains("ivr-section") && status === "online") {
      next = next.nextElementSibling;
    }

    if (next && next.id === "long-form-section") {
      const showLong = sessionStorage.getItem("requiresLongForm") === "true";
      if (!showLong) next = next.nextElementSibling;
    }

    current.style.display = "none";
    next.style.display = "block";
    reloadImages(next);
    logSectionVisible(next);
  });

  // Longform-submit event
  document.addEventListener("longFormSubmitted", () => {
    const current = document.getElementById("long-form-section");
    let next = current.nextElementSibling;

    while (next && next.classList.contains("ivr-section") && status === "online") {
      next = next.nextElementSibling;
    }

    current.style.display = "none";
    next.style.display = "block";
    reloadImages(next);
    logSectionVisible(next);
  });

  // =============================================================
  // 🎁 SOVENDUS — Lazy Loading (op basis van template 5.2)
  // =============================================================
  initSovendusLazyLoader(status);
}

// =============================================================
// 🎁 SOVENDUS Lazy Loader functie
// =============================================================
function initSovendusLazyLoader(status) {

  const sovendusSection = document.getElementById("sovendus-section");
  if (!sovendusSection) {
    console.warn("❗ Geen Sovendus-sectie gevonden.");
    return;
  }

  let nextAfterSovendus = sovendusSection.nextElementSibling;

  // Skip IVR secties indien "online"
  while (nextAfterSovendus && nextAfterSovendus.classList.contains("ivr-section") && status === "online") {
    nextAfterSovendus = nextAfterSovendus.nextElementSibling;
  }

  console.log("🔍 Sovendus LazyLoader actief…");

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {

        console.log("🎁 Sovendus sectie in beeld → setupSovendus()");
        obs.unobserve(entry.target);

        if (typeof window.setupSovendus === "function") {
          window.setupSovendus();
        }

        // Automatische doorgang na 10 sec
        setTimeout(() => {
          console.log("⏱️ Sovendus timeout → naar volgende sectie");
          sovendusSection.style.display = "none";
          nextAfterSovendus.style.display = "block";
          reloadImages(nextAfterSovendus);
          logSectionVisible(nextAfterSovendus);
        }, 10000);
      }
    });
  }, { threshold: 0.5 });

  observer.observe(sovendusSection);

  // FAILSAFE – Als SwP de sectie niet zichtbaar maakt
  setTimeout(() => {
    const visible = window.getComputedStyle(sovendusSection).display !== "none";
    if (visible && typeof window.setupSovendus === "function") {
      console.warn("⚠️ Fallback: setupSovendus handmatig gestart (observer triggerde niet)");
      window.setupSovendus();
    }
  }, 3000);
}

// =============================================================
// Helpers
// =============================================================
function reloadImages(section) {
  if (!section) return;
  const imgs = section.querySelectorAll("img[data-src]");
  imgs.forEach(img => img.src = img.dataset.src);

  window.scrollBy(0, 1);
  setTimeout(() => window.scrollBy(0, -1), 150);
}

console.info("🎉 initFlow-lite (global) loaded");
