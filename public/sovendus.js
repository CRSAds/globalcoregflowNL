// =============================================================
// ✅ sovendus.js — FLOW CONTROLLED (geen auto-start)
// - setupSovendus wordt ALLEEN door initFlow aangeroepen
// - iframe wordt pas geladen bij Sovendus-sectie
// - impression logging via Vercel API (cross-domain safe)
// =============================================================

let hasInitialized = false;
let hasAdvanced = false;
let sovendusLogged = false;

const SOV_TIMEOUT_MS = 10000;

// 👉 VASTE API BASE (belangrijk bij funnels op ander domein)
const API_BASE =
  window.API_BASE ||
  "https://globalcoregflow-nl.vercel.app";

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
// 📡 Sovendus impression loggen (1x per sessie)
// =============================================================
function logSovendusImpression() {
  if (sovendusLogged) return;

  const t_id = sessionStorage.getItem("t_id");
  const offer_id = sessionStorage.getItem("offer_id");
  const sub_id =
    sessionStorage.getItem("sub_id") ||
    sessionStorage.getItem("aff_id") ||
    "unknown";

  if (!t_id) {
    console.warn("[Sovendus] Geen t_id → impression niet gelogd");
    return;
  }

  sovendusLogged = true;

  const url = `${API_BASE}/api/sovendus-impression`;

  console.log("[Sovendus] Iframe geladen → impression loggen", {
    t_id,
    offer_id,
    sub_id,
    url
  });

  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ t_id, offer_id, sub_id })
  })
    .then(async r => {
      const txt = await r.text();
      console.log("[Sovendus] API response", r.status, txt);
    })
    .catch(err => {
      console.error("[Sovendus] Impression API fout", err);
    });
}

// =============================================================
// 🚀 setupSovendus — wordt ALLEEN vanuit initFlow aangeroepen
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

  // 🔧 Zorg dat container zichtbaar ruimte heeft
  container.style.minHeight = "60px";
  container.style.display = "block";
  container.style.width = "100%";

  // Laadmelding
  let loadingDiv = document.getElementById("sovendus-loading");
  if (!loadingDiv) {
    loadingDiv = document.createElement("div");
    loadingDiv.id = "sovendus-loading";
    loadingDiv.style.textAlign = "center";
    loadingDiv.style.padding = "16px";
    loadingDiv.innerHTML =
      `<p style="font-size:16px;">Even geduld… jouw voordeel wordt geladen!</p>`;
    container.parentNode.insertBefore(loadingDiv, container);
  }

  // Basisgegevens (zelfde gedrag als bestaande versie)
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

        // ✅ Impression loggen (nu altijd juiste timing + juiste API)
        logSovendusImpression();

        // ⏰ timeout → flow vervolgen
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
// ♻️ Backwards compatibility — initFlow roept deze aan
// =============================================================
window.setupSovendus = setupSovendus;
