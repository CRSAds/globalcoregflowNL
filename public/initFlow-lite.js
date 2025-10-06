// =============================================================
// initFlow-lite.js
// Lichtgewicht sectieregulator voor Swipe Pages + CoregFlow
// -------------------------------------------------------------
// Doet:
// 1. Toont alleen de eerste sectie bij pageload
// 2. Filtert gedrag op basis van ?status=online of ?status=live
// 3. Verbergt of toont de juiste footers
// 4. Slaat IVR-secties over bij status=online
// 5. Forceert image load bij zichtbare secties
// =============================================================

window.addEventListener("DOMContentLoaded", initFlowLite);

function initFlowLite() {
  console.log("🚀 initFlow-lite.js actief");

  const params = new URLSearchParams(window.location.search);
  const status = params.get("status") || "online";

  // Alle secties in Swipe Pages
  const allSections = Array.from(document.querySelectorAll(".flow-section, .coreg-section, .ivr-section"));
  console.log("📦 Aantal gevonden secties:", allSections.length);

  // === 1️⃣ Verberg alles bij pageload ===
  allSections.forEach(el => (el.style.display = "none"));

  // === 2️⃣ Eerste sectie tonen ===
  const first = allSections.find(el => !el.classList.contains("ivr-section"));
  if (first) {
    first.style.display = "block";
    reloadImages(first);
    console.log("✅ Eerste sectie getoond:", first.className);
  }

  // === 3️⃣ Filter op status (online / live) ===
  if (status === "online") {
    console.log("🌐 Status = ONLINE → IVR overslaan, footeronline tonen");

    // IVR-secties verbergen
    document.querySelectorAll(".ivr-section").forEach(el => (el.style.display = "none"));

    // Alleen footeronline tonen
    document.querySelectorAll(".footeronline").forEach(el => (el.style.display = "block"));
    document.querySelectorAll(".footerlive").forEach(el => (el.style.display = "none"));
  } else if (status === "live") {
    console.log("📺 Status = LIVE → IVR actief, footerlive tonen");

    // footers omdraaien
    document.querySelectorAll(".footeronline").forEach(el => (el.style.display = "none"));
    document.querySelectorAll(".footerlive").forEach(el => (el.style.display = "block"));
  }

  // === 4️⃣ SwipePages flow-buttons beheren ===
  const flowButtons = document.querySelectorAll(".flow-next");
  flowButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const current = btn.closest(".flow-section, .coreg-section, .ivr-section");
      if (!current) return;

      // Huidige verbergen
      current.style.display = "none";

      // Volgende sectie vinden
      let next = current.nextElementSibling;
      while (next && next.classList.contains("ivr-section") && status === "online") {
        // sla ivr-secties over bij ONLINE
        next = next.nextElementSibling;
      }

      if (next) {
        next.style.display = "block";
        reloadImages(next);
        window.scrollTo({ top: 0, behavior: "smooth" });
        console.log("➡️ Volgende sectie getoond:", next.className);
      } else {
        console.log("🏁 Einde van flow bereikt");
      }
    });
  });

  // === 5️⃣ Check of alle hoofdscripts geladen zijn ===
  console.groupCollapsed("✅ Global CoregFlow System Check");
  console.log("formSubmit.js geladen:", !!window.buildPayload);
  console.log("coregRenderer.js geladen:", !!window.initCoregFlow);
  console.log("progressbar-anim.js geladen:", !!window.animateProgressBar);
  console.log("initFlow-lite.js actief");
  console.log("IVR geladen:", document.querySelectorAll(".ivr-section").length > 0);
  console.log("Memory geladen:", typeof window.memoryGame !== "undefined");
  console.groupEnd();
}

// =============================================================
// Hulpfunctie: forceer lazy images te laden
// =============================================================
function reloadImages(section) {
  if (!section) return;
  const imgs = section.querySelectorAll("img[data-src], img[src*='data:image']");
  imgs.forEach(img => {
    const newSrc = img.getAttribute("data-src") || img.src;
    if (newSrc && !img.src.includes(newSrc)) {
      img.src = newSrc;
    }
  });
}
