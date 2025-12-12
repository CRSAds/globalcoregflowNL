// =============================================================
// ✅ sovendus.js — GLOBALCOREG SAFE VERSION
// - Start Sovendus alleen als sectie zichtbaar is
// - Beschermt tegen te vroege / dubbele initialisatie
// - Breekt GEEN bestaande flow-logica
// =============================================================

let hasInitialized = false;
let hasAdvanced = false;
const SOV_TIMEOUT_MS = 10000;

// =============================================================
// ➡️ Flow vervolgen na Sovendus
// =============================================================
function advanceAfterSovendus() {
  if (hasAdvanced) return;
  hasAdvanced = true;

  const current = document.getElementById("sovendus-section");
  if (!current) return;

  let next = current.nextElementSibling;
  while (next && next.classList.contains("ivr-section")) {
    next = next.nextElementSibling;
  }

  if (next) {
    current.style.display = "none";
    next.style.display = "block";

    if (typeof window.reloadImages === "function") {
      window.reloadImages(next);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
    console.log("➡️ Flow vervolgd na Sovendus");
  } else {
    console.log("🏁 Geen volgende sectie gevonden na Sovendus");
  }
}

// =============================================================
// 🚀 Originele setupSovendus (ONGEWIJZIGD gedrag)
// =============================================================
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

  // Laadmelding
  let loadingDiv = document.getElementById("sovendus-loading");
  if (!loadingDiv) {
    loadingDiv = document.createElement("div");
    loadingDiv.id = "sovendus-loading";
    loadingDiv.style.textAlign = "center";
    loadingDiv.style.padding = "16px";
    loadingDiv.innerHTML = `<p style="font-size:16px;">Even geduld… jouw voordeel wordt geladen!</p>`;
    container.parentNode.insertBefore(loadingDiv, container);
  }

  // Basisgegevens
  const t_id = sessionStorage.getItem("t_id") || crypto.randomUUID();
  const gender = sessionStorage.getItem("gender") || "";
  const firstname = sessionStorage.getItem("firstname") || "";
  const lastname = sessionStorage.getItem("lastname") || "";
  const email = sessionStorage.getItem("email") || "";
  const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);

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
    timestamp,
    orderId: "",
    orderValue: "",
    orderCurrency: "",
    usedCouponCode: "",
    iframeContainerId: containerId,
  });

  const script = document.createElement("script");
  script.src = "https://api.sovendus.com/sovabo/common/js/flexibleIframe.js";
  script.async = true;

  script.onload = () => {
    console.log("✅ Sovendus script geladen");

    const observer = new MutationObserver((_, obs) => {
      const iframe = container.querySelector("iframe");
      if (iframe) {
        console.log("🎯 Sovendus iframe gedetecteerd");
        document.getElementById("sovendus-loading")?.remove();

        setTimeout(() => {
          const section = document.getElementById("sovendus-section");
          if (section && window.getComputedStyle(section).display !== "none") {
            console.log("⏰ Sovendus timeout → flow vervolgen");
            advanceAfterSovendus();
          }
        }, SOV_TIMEOUT_MS);

        obs.disconnect();
      }
    });

    observer.observe(container, { childList: true, subtree: true });
  };

  script.onerror = () => {
    console.error("❌ Sovendus script laadfout");
    setTimeout(advanceAfterSovendus, 2000);
  };

  document.body.appendChild(script);
}

// =============================================================
// 🛡️ SAFE WRAPPER — HET BELANGRIJKSTE DEEL
// =============================================================
window.safeStartSovendus = function () {
  if (window.__sovendusSafeStarted) return;

  const section = document.getElementById("sovendus-section");
  const container = document.getElementById("sovendus-container-1");
  if (!section || !container) return;

  const visible = window.getComputedStyle(section).display !== "none";
  if (!visible) return;

  window.__sovendusSafeStarted = true;
  console.log("🛡️ safeStartSovendus → voorwaarden ok → start");
  setupSovendus();
};

// =============================================================
// 👀 Observer: start zodra Sovendus-sectie zichtbaar wordt
// =============================================================
(function observeSovendusVisibility() {
  const observer = new MutationObserver(() => {
    window.safeStartSovendus();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["style", "class"]
  });

  // Eerste check (voor het geval hij al zichtbaar is)
  document.addEventListener("DOMContentLoaded", () => {
    window.safeStartSovendus();
  });
})();

// =============================================================
// ♻️ Backwards compatibility
// =============================================================
window.setupSovendus = setupSovendus;
