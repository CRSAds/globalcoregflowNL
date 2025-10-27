// =============================================================
// sovendus.js — Klik-actieve versie voor Swipe Pages
// -------------------------------------------------------------
// Functies:
// 1️⃣ Initialiseert Sovendus zodra sectie zichtbaar wordt
// 2️⃣ Detecteert klik op de Sovendus-container
// 3️⃣ Gaat automatisch verder naar volgende sectie in de flow
// =============================================================

let hasInitialized = false;

function setupSovendus() {
  if (hasInitialized) {
    console.log("⚠️ setupSovendus al uitgevoerd — overslaan");
    return;
  }
  hasInitialized = true;
  console.log("👉 setupSovendus gestart");

  const containerId = "sovendus-container-1";
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`❌ Container #${containerId} niet gevonden`);
    return;
  }

  // Stap 1: container leegmaken (veiligheid)
  container.innerHTML = "";

  // Stap 2: laadbericht
  let loadingDiv = document.getElementById("sovendus-loading");
  if (!loadingDiv) {
    loadingDiv = document.createElement("div");
    loadingDiv.id = "sovendus-loading";
    loadingDiv.style.textAlign = "center";
    loadingDiv.style.padding = "16px";
    loadingDiv.innerHTML = `<p style="font-size: 16px;">Even geduld… jouw voordeel wordt geladen!</p>`;
    container.parentNode.insertBefore(loadingDiv, container);
  }

  // Stap 3: data ophalen uit sessionStorage
  const t_id = sessionStorage.getItem("t_id") || crypto.randomUUID();
  const gender = sessionStorage.getItem("gender") || "";
  const firstname = sessionStorage.getItem("firstname") || "";
  const lastname = sessionStorage.getItem("lastname") || "";
  const email = sessionStorage.getItem("email") || "";
  const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);

  console.log("📦 Sovendus data:", { t_id, gender, firstname, lastname, email, timestamp });

  // Stap 4: globale consumentenobject
  window.sovConsumer = {
    consumerSalutation: gender,
    consumerFirstName: firstname,
    consumerLastName: lastname,
    consumerEmail: email,
  };

  // Stap 5: globale iframeconfiguratie
  window.sovIframes = window.sovIframes || [];
  window.sovIframes.push({
    trafficSourceNumber: "5592",
    trafficMediumNumber: "1",
    sessionId: t_id,
    timestamp: timestamp,
    orderId: "",
    orderValue: "",
    orderCurrency: "",
    usedCouponCode: "",
    iframeContainerId: containerId,
  });

  // Stap 6: externe script laden
  const script = document.createElement("script");
  script.src = "https://api.sovendus.com/sovabo/common/js/flexibleIframe.js";
  script.async = true;

  script.onload = () => {
    console.log("✅ Sovendus → flexibleIframe.js geladen");
    const loadingEl = document.getElementById("sovendus-loading");
    if (loadingEl) loadingEl.remove();

    // 🎯 Klikdetectie op Sovendus-container
    const container = document.getElementById("sovendus-container-1");
    if (container) {
      container.addEventListener("click", () => {
        console.log("🎁 Sovendus-container aangeklikt → doorgaan naar volgende sectie");

        const current = document.getElementById("sovendus-section");
        if (current) {
          let next = current.nextElementSibling;
          while (next && next.classList.contains("ivr-section")) {
            next = next.nextElementSibling;
          }
          if (next) {
            current.style.display = "none";
            next.style.display = "block";
            window.scrollTo({ top: 0, behavior: "smooth" });
            console.log("➡️ Flow vervolgd na Sovendus");
          } else {
            console.log("🏁 Geen volgende sectie gevonden na Sovendus");
          }
        }
      });
    }
  };

  script.onerror = () => {
    console.error("❌ Fout bij laden van flexibleIframe.js");
  };

  document.body.appendChild(script);
}

// =============================================================
// ✅ Automatische fallback bij pageload
// =============================================================
document.addEventListener("DOMContentLoaded", () => {
  const section = document.getElementById("sovendus-section");
  if (!section) return;

  const style = window.getComputedStyle(section);
  if (style.display !== "none") {
    console.log("🎁 Sovendus-sectie al zichtbaar bij load → directe init");
    setupSovendus();
  }
});

// Exporteer naar global scope
window.setupSovendus = setupSovendus;
