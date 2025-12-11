// =============================================================
// 🎁 sovendus.js — verbeterde definitieve versie
// GLOBALCOREGFLOW / TEMPLATE 5.2 COMPATIBLE
// =============================================================

let hasInitialized = false;
let hasAdvanced = false;
const SOV_TIMEOUT_MS = 10000;

// -------------------------------------------------------------
// 🔄 Doorgaan naar volgende sectie
// -------------------------------------------------------------
function advanceAfterSovendus() {
  if (hasAdvanced) return;
  hasAdvanced = true;

  const current = document.getElementById("sovendus-section");
  if (!current) {
    console.warn("❗ Geen Sovendus-sectie gevonden bij advance()");
    return;
  }

  let next = current.nextElementSibling;

  // Skip IVR-secties (zoals NL & 5.2 flows vereisen)
  while (next && next.classList.contains("ivr-section")) {
    next = next.nextElementSibling;
  }

  if (next) {
    current.style.display = "none";
    next.style.display = "block";

    if (typeof window.reloadImages === "function") {
      reloadImages(next);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
    console.log("➡️ Flow vervolgd na Sovendus");
  } else {
    console.log("🏁 Einde Sovendus → geen volgende sectie");
  }
}

// -------------------------------------------------------------
// 🚀 Hoofdfunctie: Sovendus initialiseren
// -------------------------------------------------------------
function setupSovendus() {
  if (hasInitialized) {
    console.log("⚠️ setupSovendus() al uitgevoerd → skip");
    return;
  }
  hasInitialized = true;

  console.log("👉 setupSovendus gestart");

  const containerId = "sovendus-container-1";
  const container = document.getElementById(containerId);

  if (!container) {
    console.error(`❌ Container ${containerId} niet gevonden`);
    return;
  }

  // -------------------------------------------------------------
  // ⏳ Laadbericht plaatsen
  // -------------------------------------------------------------
  let loadingDiv = document.getElementById("sovendus-loading");
  if (!loadingDiv) {
    loadingDiv = document.createElement("div");
    loadingDiv.id = "sovendus-loading";
    loadingDiv.style.textAlign = "center";
    loadingDiv.style.padding = "16px";
    loadingDiv.innerHTML = `<p style="font-size: 16px;">Even geduld… jouw voordeel wordt geladen!</p>`;
    container.parentNode.insertBefore(loadingDiv, container);
  }

  // -------------------------------------------------------------
  // 🧬 Gebruikersdata uit sessie
  // -------------------------------------------------------------
  const t_id = sessionStorage.getItem("t_id") || crypto.randomUUID();
  const gender = sessionStorage.getItem("gender") || "";
  const firstname = sessionStorage.getItem("firstname") || "";
  const lastname = sessionStorage.getItem("lastname") || "";
  const email = sessionStorage.getItem("email") || "";
  const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);

  console.log("📦 Sovendus data:", {
    t_id, gender, firstname, lastname, email, timestamp
  });

  // -------------------------------------------------------------
  // 🌍 Globale configs voor Sovendus API script
  // -------------------------------------------------------------
  window.sovConsumer = {
    consumerSalutation: gender,
    consumerFirstName: firstname,
    consumerLastName: lastname,
    consumerEmail: email,
  };

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

  // -------------------------------------------------------------
  // 📥 Extern iframe-script injecteren
  // -------------------------------------------------------------
  const script = document.createElement("script");
  script.src = "https://api.sovendus.com/sovabo/common/js/flexibleIframe.js";
  script.async = true;

  script.onload = () => {
    console.log("✅ flexibleIframe.js geladen");

    // -------------------------------------------------------------
    // 👀 Detectie van iframe render
    // -------------------------------------------------------------
    const observer = new MutationObserver((mutations, obs) => {
      const iframe = container.querySelector("iframe");

      if (iframe) {
        console.log("🎯 Sovendus-iframe geladen → laadbericht weg");
        const loader = document.getElementById("sovendus-loading");
        if (loader) loader.remove();

        // Pas NU start timeout
        setTimeout(() => {
          const section = document.getElementById("sovendus-section");
          const visible = section && window.getComputedStyle(section).display !== "none";

          if (visible) {
            console.log(`⏱️ Timeout (${SOV_TIMEOUT_MS}ms) → automatisch verder`);
            advanceAfterSovendus();
          }
        }, SOV_TIMEOUT_MS);

        obs.disconnect();
      }
    });

    observer.observe(container, { childList: true, subtree: true });
  };

  script.onerror = () => {
    console.error("❌ Error bij laden flexibleIframe.js");

    // Fallback: direct doorgaan na korte wachttijd
    setTimeout(() => {
      if (!hasAdvanced) {
        console.warn("⚠️ Fallback na Sovendus load error → door");
        advanceAfterSovendus();
      }
    }, 2000);
  };

  document.body.appendChild(script);
}

window.setupSovendus = setupSovendus;
