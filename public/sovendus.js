// =============================================================
// sovendus.js — Auto-advance versie (alleen timeout, geen early init)
// =============================================================

let hasInitialized = false;
let hasAdvanced = false;

// 👉 tijd tot automatisch doorgaan (ms)
const SOV_TIMEOUT_MS = 10000;

function advanceAfterSovendus() {
  if (hasAdvanced) return;
  hasAdvanced = true;

  const current = document.getElementById("sovendus-section");
  if (!current) {
    console.warn("⚠️ Sovendus-sectie niet gevonden bij advance");
    return;
  }

  let next = current.nextElementSibling;
  // sla IVR-secties over (consistent met initFlow-lite)
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

  // container leegmaken
  container.innerHTML = "";

  // laadbericht
  let loadingDiv = document.getElementById("sovendus-loading");
  if (!loadingDiv) {
    loadingDiv = document.createElement("div");
    loadingDiv.id = "sovendus-loading";
    loadingDiv.style.textAlign = "center";
    loadingDiv.style.padding = "16px";
    loadingDiv.innerHTML = `<p style="font-size: 16px;">Even geduld… jouw voordeel wordt geladen!</p>`;
    container.parentNode.insertBefore(loadingDiv, container);
  }

  // data uit sessionStorage
  const t_id = sessionStorage.getItem("t_id") || crypto.randomUUID();
  const gender = sessionStorage.getItem("gender") || "";
  const firstname = sessionStorage.getItem("firstname") || "";
  const lastname = sessionStorage.getItem("lastname") || "";
  const email = sessionStorage.getItem("email") || "";
  const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);

  console.log("📦 Sovendus data:", { t_id, gender, firstname, lastname, email, timestamp });

  // global consumer + iframe config
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

  // extern script laden
  const script = document.createElement("script");
  script.src = "https://api.sovendus.com/sovabo/common/js/flexibleIframe.js";
  script.async = true;

  script.onload = () => {
    console.log("✅ Sovendus → flexibleIframe.js geladen");
    document.getElementById("sovendus-loading")?.remove();

    // ⏱️ auto-advance na timeout (éénmalig)
    setTimeout(() => {
      const section = document.getElementById("sovendus-section");
      if (!section) return;
      const visible = window.getComputedStyle(section).display !== "none";
      if (visible) {
        console.log(`⏰ Timeout (${SOV_TIMEOUT_MS} ms) bereikt → door naar volgende sectie`);
        advanceAfterSovendus();
      }
    }, SOV_TIMEOUT_MS);
  };

  script.onerror = () => {
    console.error("❌ Fout bij laden van flexibleIframe.js");
    // bij fout toch niet blokkeren — ga na korte delay door
    setTimeout(() => {
      if (!hasAdvanced) {
        console.log("⚠️ Fallback na laadfout → door naar volgende sectie");
        advanceAfterSovendus();
      }
    }, 2000);
  };

  document.body.appendChild(script);
}

// Alleen beschikbaar stellen voor initFlow-lite.js
window.setupSovendus = setupSovendus;
