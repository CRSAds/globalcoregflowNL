// =============================================================
// ✅ initFlow-lite.js — productieversie (silent mode)
// GLOBALCOREGFLOW
// =============================================================

// Debug toggle (false = productie)
const FLOW_DEBUG = false;
const flowLog  = (...args) => { if (FLOW_DEBUG) console.log(...args); };

// ===== FLOW LOGGING: centraal endpoint =====
const FLOW_LOG_ENDPOINT =
  window.FLOW_LOG_ENDPOINT ||
  "https://globalcoregflow-nl.vercel.app/api/flow-log.js";

function sendFlowLog(event) {
  try {
    const payload = {
      event,
      ts: Date.now(),
      url: window.location.href,
      ua: navigator.userAgent,
    };

    fetch(FLOW_LOG_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch (e) {}
}

// ===== sectie-visible logger via log-* class =====
function logSectionVisible(section) {
  if (!section) return;

  const cls = Array.from(section.classList).find(c => c.startsWith("log-"));
  if (!cls) return; // geen logging gewenst

  const name = cls.replace("log-", "");
  const eventName = `${name}_visible`;

  sendFlowLog(eventName);
}

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
// 🚀 Hoofdinit — flow controller
// =============================================================
function initFlowLite() {
  sendFlowLog("flow_start");

  const params = new URLSearchParams(window.location.search);
  const status = params.get("status") || "online";

  // Alle secties ophalen
  const allSections = Array.from(document.querySelectorAll(".flow-section, .ivr-section"));
  allSections.forEach(el => el.style.display = "none");

  // Coreg container blijft zichtbaar
  const coregContainer = document.getElementById("coreg-container");
  if (coregContainer) coregContainer.style.display = "block";

  // Eerste zichtbare sectie tonen
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
      if (btn.closest("#lead-form")) return; // shortform apart

      const current = btn.closest(".flow-section, .ivr-section");
      if (!current) return;

      current.style.display = "none";

      let next = current.nextElementSibling;

      // skip ivr if online
      while (next && next.classList.contains("ivr-section") && status === "online") {
        next = next.nextElementSibling;
      }

      // longform skip
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

  // Event na shortform
  document.addEventListener("shortFormSubmitted", () => {
    const form = document.getElementById("lead-form");
    const current = form.closest(".flow-section");
    let next = current.nextElementSibling;

    // ivr skip
    while (next && next.classList.contains("ivr-section") && status === "online") {
      next = next.nextElementSibling;
    }

    // longform skip
    if (next && next.id === "long-form-section") {
      const showLong = sessionStorage.getItem("requiresLongForm") === "true";
      if (!showLong) next = next.nextElementSibling;
    }

    current.style.display = "none";
    next.style.display = "block";
    reloadImages(next);
    logSectionVisible(next);
  });

  // Event na longform
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
