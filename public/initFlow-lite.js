// =============================================================
// initFlow-lite.js
// Lichtgewicht sectieregulator voor Swipe Pages + CoregFlow
// -------------------------------------------------------------
// Functies:
// 1️⃣ Toont alleen de eerste zichtbare sectie bij pageload
// 2️⃣ Werkt met ?status=online of ?status=live
// 3️⃣ Zorgt dat footers correct getoond worden per status
// 4️⃣ Slaat IVR-secties over bij status=online
// 5️⃣ Houdt CoregFlow (#coreg-container) altijd zichtbaar
// 6️⃣ Forceert image load voor zichtbare secties
// =============================================================

window.addEventListener("DOMContentLoaded", initFlowLite);

function initFlowLite() {
  console.log("🚀 initFlow-lite.js gestart");

  const params = new URLSearchParams(window.location.search);
  const status = params.get("status") || "online";

  // ============================================================
  // 1️⃣ Selectie van secties
  // ============================================================
  const allSections = Array.from(
    document.querySelectorAll(".flow-section, .ivr-section")
  );
  console.log("📦 Swipe-secties gevonden:", allSections.length);

  // Coreg-container apart houden — deze mag niet verborgen worden
  const coregContainer = document.getElementById("coreg-container");
  if (coregContainer) {
    coregContainer.style.display = "block";
    console.log("✅ coreg-container zichtbaar gehouden");
  }

  // Verberg alle gewone secties bij pageload
  allSections.forEach(el => (el.style.display = "none"));

  // ============================================================
  // 2️⃣ Eerste sectie tonen (niet-IVR)
  // ============================================================
  const firstVisible = allSections.find(
    el => !el.classList.contains("ivr-section")
  );
  if (firstVisible) {
    firstVisible.style.display = "block";
    reloadImages(firstVisible);
    console.log("✅ Eerste sectie getoond:", firstVisible.className);
  } else {
    console.warn("⚠️ Geen zichtbare secties gevonden bij start");
  }

  // ============================================================
  // 3️⃣ Statusspecifiek gedrag (online vs live)
  // ============================================================
  if (status === "online") {
    console.log("🌐 Status = ONLINE → IVR-secties overslaan + footeronline tonen");

    // IVR verbergen
    document.querySelectorAll(".ivr-section").forEach(el => (el.style.display = "none"));

    // Footer configuratie
    document.querySelectorAll(".footeronline").forEach(el => (el.style.display = "block"));
    document.querySelectorAll(".footerlive").forEach(el => (el.style.display = "none"));
  } else if (status === "live") {
    console.log("📺 Status = LIVE → IVR actief + footerlive tonen");

    // Footer configuratie
    document.querySelectorAll(".footeronline").forEach(el => (el.style.display = "none"));
    document.querySelectorAll(".footerlive").forEach(el => (el.style.display = "block"));
  }

  // ============================================================
  // 4️⃣ Navigatie tussen secties (flow-next knoppen)
  // ============================================================
  const flowButtons = document.querySelectorAll(".flow-next");
  flowButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const current = btn.closest(".flow-section, .ivr-section");
      if (!current) return;

      current.style.display = "none";
      let next = current.nextElementSibling;

      // Bij status=online → IVR-secties overslaan
      while (next && next.classList.contains("ivr-section") && status === "online") {
        next = next.nextElementSibling;
      }

      // Volgende sectie tonen
      if (next) {
        next.style.display = "block";
        reloadImages(next);
        window.scrollTo({ top: 0, behavior: "smooth" });
        console.log("➡️ Volgende sectie getoond:", next.className);
      } else {
        console.log("🏁 Einde van de flow bereikt");
      }
    });
  });

  // ============================================================
  // 5️⃣ System Check Log (voor debugging)
  // ============================================================
  console.groupCollapsed("✅ Global CoregFlow System Check");
  console.log("formSubmit.js geladen:", !!window.buildPayload);
  console.log("coregRenderer.js geladen:", typeof window.initCoregFlow === "function");
  console.log("progressbar-anim.js geladen:", typeof window.animateProgressBar === "function");
  console.log("initFlow-lite.js actief");
  console.log("IVR aanwezig:", document.querySelectorAll(".ivr-section").length);
  console.log("Memory script actief:", typeof window.memoryGame !== "undefined");
  console.groupEnd();
}

// =============================================================
// Hulpfunctie: forceer lazy images of data-src afbeeldingen te laden
// =============================================================
function reloadImages(section) {
  if (!section) return;
  const imgs = section.querySelectorAll("img[data-src], img[src*='data:image']");
  imgs.forEach(img => {
    const newSrc = img.getAttribute("data-src") || img.src;
    if (newSrc && img.src !== newSrc) {
      img.src = newSrc;
    }
  });
}
