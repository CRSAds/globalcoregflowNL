// =============================================================
// sovendus.js
// Integreert Sovendus kortingsbanner in Swipe Pages funnel
// -------------------------------------------------------------
// Functies:
// 1️⃣ Leest persoonsgegevens uit sessionStorage
// 2️⃣ Initialiseert het Sovendus-iframe éénmalig
// 3️⃣ Werkt samen met initFlow-lite.js (🎁 Sovendus-sectie getoond)
// =============================================================

let hasInitialized = false;

export default function setupSovendus() {
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

  // Stap 2: laadbericht (indien nog niet aanwezig)
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
  };

  script.onerror = () => {
    console.error("❌ Fout bij laden van flexibleIframe.js");
  };

  document.body.appendChild(script);
}

// =============================================================
// ✅ Automatische initialisatie (fallback)
// Wordt uitgevoerd als de sectie al zichtbaar is bij pageload
// =============================================================
document.addEventListener("DOMContentLoaded", () => {
  const section = document.getElementById("sovendus-section");
  if (!section) {
    console.warn("⚠️ Geen Sovendus-sectie gevonden bij pageload");
    return;
  }

  // Als sectie direct zichtbaar is (bijv. bij refresh)
  const style = window.getComputedStyle(section);
  if (style.display !== "none" && typeof window.setupSovendus === "function") {
    console.log("🎁 Sovendus-sectie al zichtbaar bij load → directe init");
    window.setupSovendus();
  }
});

// Exporteer naar global scope voor initFlow-lite.js
window.setupSovendus = setupSovendus;
