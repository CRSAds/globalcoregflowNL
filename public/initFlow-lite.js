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
// 7️⃣ Gaat automatisch verder na long form submit
// =============================================================

window.addEventListener("DOMContentLoaded", initFlowLite);

function initFlowLite() {
  console.log("🚀 initFlow-lite.js gestart");

  // Wacht op coregReady event voordat flow start
  document.addEventListener("coregReady", (e) => {
    console.log("✅ coregReady ontvangen:", e.detail.campaigns?.length, "campagnes");
  });

  const params = new URLSearchParams(window.location.search);
  const status = params.get("status") || "online";

  // ============================================================
  // 1️⃣ Selectie van secties
  // ============================================================
  const allSections = Array.from(document.querySelectorAll(".flow-section, .ivr-section"));
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
  const firstVisible = allSections.find(el => !el.classList.contains("ivr-section"));
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

    document.querySelectorAll(".ivr-section").forEach(el => (el.style.display = "none"));
    document.querySelectorAll(".footeronline").forEach(el => (el.style.display = "block"));
    document.querySelectorAll(".footerlive").forEach(el => (el.style.display = "none"));
  } else if (status === "live") {
    console.log("📺 Status = LIVE → IVR actief + footerlive tonen");

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

      // 🔍 Check of de volgende sectie het long form is
      if (next && next.id === "long-form-section") {
        const showLongForm = sessionStorage.getItem("requiresLongForm") === "true";
        if (!showLongForm) {
          console.log("🚫 Geen longform-campagnes positief beantwoord → long form overslaan");
          // zoek de eerstvolgende sectie na het long form
          next = next.nextElementSibling;
          while (next && next.classList.contains("ivr-section") && status === "online") {
            next = next.nextElementSibling;
          }
        } else {
          console.log("✅ Positieve longform-campagne gevonden → long form tonen");
        }
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
// 5️⃣ Automatische doorgang na long form submit
// ============================================================
document.addEventListener("longFormSubmitted", () => {
  console.log("✅ Long form voltooid → door naar volgende sectie");
  const current = document.getElementById("long-form-section");
  if (!current) return;

  let next = current.nextElementSibling;
  while (next && next.classList.contains("ivr-section") && status === "online") {
    next = next.nextElementSibling;
  }

  if (next) {
    current.style.display = "none";
    next.style.display = "block";
    reloadImages(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    console.log("🏁 Einde van de flow bereikt na long form");
  }
});
  }

  // ============================================================
  // 6️⃣ System Check Log (debug)
  // ============================================================
  console.groupCollapsed("✅ Global CoregFlow System Check");
  console.log("formSubmit.js geladen:", !!window.buildPayload);
  console.log("coregRenderer.js geladen:", typeof window.initCoregFlow === "function");
  console.log("progressbar-anim.js geladen:", typeof window.animateProgressBar === "function");
  console.log("initFlow-lite.js actief");
  console.log("IVR aanwezig:", document.querySelectorAll(".ivr-section").length);
  console.log("Memory script actief:", typeof window.memoryGame !== "undefined");

  if (window.allCampaigns && Array.isArray(window.allCampaigns)) {
    console.log(`📊 Coreg campagnes geladen uit Directus: ${window.allCampaigns.length}`);
  } else {
    console.warn("⚠️ Coreg campagnes nog niet geladen of onbekend (window.allCampaigns ontbreekt)");
  }

  console.groupEnd();
}

// =============================================================
// Hulpfunctie: forceer lazy images te laden + mini scroll bump
// =============================================================
function reloadImages(section) {
  if (!section) return;

  const imgs = section.querySelectorAll("img[data-src], img[src*='data:image']");
  imgs.forEach(img => {
    const newSrc = img.getAttribute("data-src") || img.src;
    if (newSrc && !img.src.includes(newSrc)) img.src = newSrc;
  });

  window.scrollBy(0, 1);
  setTimeout(() => window.scrollBy(0, -1), 150);

  const visibleImages = section.querySelectorAll("img");
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.target.dataset.src) {
        entry.target.src = entry.target.dataset.src;
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  visibleImages.forEach(img => observer.observe(img));
  console.log("🖼️ Afbeeldingen geforceerd geladen in sectie:", section.className);
}
