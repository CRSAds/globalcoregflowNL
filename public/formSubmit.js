// =============================================================
// formSubmit.js — versie met tracking-fallbacks en shortform-garantie (campagne 925)
// =============================================================

window.submittedCampaigns = window.submittedCampaigns || new Set();

// -------------------------------------------------------------
// 🔹 Tracking-parameters bij pageload opslaan
// -------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  ["t_id", "aff_id", "sub_id", "sub2", "offer_id"].forEach(key => {
    const val = urlParams.get(key);
    if (val) sessionStorage.setItem(key, val);
  });
});

// -------------------------------------------------------------
// 🔹 Payload opbouwen
// -------------------------------------------------------------
function buildPayload(campaign = {}) {
  // --- Basis tracking fallbacks ---
  const t_id = sessionStorage.getItem("t_id") || crypto.randomUUID();
  const aff_id = sessionStorage.getItem("aff_id") || "unknown";
  const offer_id = sessionStorage.getItem("offer_id") || "unknown";
  const sub_id = sessionStorage.getItem("sub_id") || "unknown";
  const sub2 = sessionStorage.getItem("sub2") || "unknown";

  // --- Campagne-URL altijd met ?status=online ---
  const campaignUrl = `${window.location.origin}${window.location.pathname}?status=online`;

  // --- Geboortedatum normaliseren ---
  const dob_day = sessionStorage.getItem("dob_day");
  const dob_month = sessionStorage.getItem("dob_month");
  const dob_year = sessionStorage.getItem("dob_year");
  const dob_iso =
    dob_year && dob_month && dob_day
      ? `${dob_year.padStart(4, "0")}-${dob_month.padStart(2, "0")}-${dob_day.padStart(2, "0")}`
      : "";

  // --- Payload samenstellen ---
  const payload = {
    cid: campaign.cid || "925",
    sid: campaign.sid || "34",
    gender: sessionStorage.getItem("gender") || "",
    firstname: sessionStorage.getItem("firstname") || "",
    lastname: sessionStorage.getItem("lastname") || "",
    email: sessionStorage.getItem("email") || "",
    f_5_dob: dob_iso,
    postcode: sessionStorage.getItem("postcode") || "",
    straat: sessionStorage.getItem("straat") || "",
    huisnummer: sessionStorage.getItem("huisnummer") || "",
    woonplaats: sessionStorage.getItem("woonplaats") || "",
    telefoon: sessionStorage.getItem("telefoon") || "",
    f_1322_transaction_id: t_id,
    f_1453_campagne_url: campaignUrl,
    f_1684_sub_id: sub_id,
    f_1685_aff_id: aff_id,
    f_1687_offer_id: offer_id,
    sub2,
    is_shortform: campaign.is_shortform || false
  };

  console.log("📦 Payload opgebouwd:", payload);
  return payload;
}

// -------------------------------------------------------------
// 🔹 Lead versturen via API
// -------------------------------------------------------------
async function fetchLead(payload) {
  const key = `${payload.cid}_${payload.sid}`;
  if (window.submittedCampaigns.has(key)) return { skipped: true };

  try {
    const res = await fetch("https://globalcoregflow-nl.vercel.app/api/lead.js", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
      body: JSON.stringify(payload)
    });

    const text = await res.text();
    let result = {};
    try {
      result = text ? JSON.parse(text) : {};
    } catch {
      result = { raw: text };
    }

    console.log(`📨 Lead verstuurd naar ${payload.cid}/${payload.sid}:`, result);
    window.submittedCampaigns.add(key);
    return result;
  } catch (err) {
    console.error("❌ Fout bij lead versturen:", err);
    return { success: false, error: err };
  }
}

window.buildPayload = buildPayload;
window.fetchLead = fetchLead;

// -------------------------------------------------------------
// 🔹 Live form tracking (inputs opslaan in sessionStorage)
// -------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const shortForm = document.querySelector("#lead-form");
  const longForm = document.querySelector("#long-form");

  [shortForm, longForm].forEach(form => {
    if (!form) return;
    form.querySelectorAll("input").forEach(input => {
      const name = input.name || input.id;
      if (!name) return;
      const save = () => {
        if (input.type === "radio" && !input.checked) return;
        sessionStorage.setItem(name, input.value.trim());
      };
      input.addEventListener("input", save);
      input.addEventListener("change", save);
    });
  });
  console.log("🧠 Live form tracking actief (short + long)");
});

// -------------------------------------------------------------
// 🔹 Shortform submit (→ altijd campagne 925)
// -------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const shortForm = document.querySelector("#lead-form");
  if (!shortForm) return;

  shortForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("🟢 Shortform verzonden...");

    // waarden opslaan
    shortForm.querySelectorAll("input").forEach(input => {
      const name = input.name || input.id;
      if (name && input.value.trim()) sessionStorage.setItem(name, input.value.trim());
    });

    // hoofdlead 925
    const basePayload = buildPayload({ cid: "925", sid: "34", is_shortform: true });
    await fetchLead(basePayload);
    console.log("✅ Shortform lead verzonden naar campagne 925");

    // sponsors-akkoord?
    const accepted = sessionStorage.getItem("sponsorsAccepted") === "true";
    if (!accepted) {
      console.log("⚠️ Voorwaarden niet geaccepteerd — alleen hoofdlead verzonden.");
      return;
    }

    // co-sponsors ophalen & posten
    try {
      const res = await fetch("https://globalcoregflow-nl.vercel.app/api/cosponsors.js");
      const json = await res.json();

      if (json.data && json.data.length > 0) {
        console.log(`📡 Verstuur naar ${json.data.length} co-sponsors...`);
        await Promise.allSettled(json.data.map(async sponsor => {
          if (!sponsor.cid || !sponsor.sid) return;
          const sponsorPayload = buildPayload({
            cid: sponsor.cid,
            sid: sponsor.sid,
            is_shortform: true
          });
          await fetchLead(sponsorPayload);
        }));
      } else {
        console.log("ℹ️ Geen actieve co-sponsors gevonden.");
      }
    } catch (err) {
      console.error("❌ Fout bij ophalen/versturen co-sponsors:", err);
    }
  });
});

// -------------------------------------------------------------
// 🔹 Longform submit
// -------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("submit-long-form");
  const form = document.getElementById("long-form");
  if (!btn || !form) return;

  let submitting = false;
  btn.addEventListener("click", async () => {
    if (submitting) return;
    submitting = true;

    const fields = ["postcode", "straat", "huisnummer", "woonplaats", "telefoon"];
    const values = Object.fromEntries(fields.map(id => [id, document.getElementById(id)?.value.trim() || ""]));

    if (Object.values(values).some(v => !v)) {
      alert("Vul alle verplichte velden in voordat je doorgaat.");
      submitting = false;
      return;
    }

    for (const [k, v] of Object.entries(values)) sessionStorage.setItem(k, v);
    const pending = JSON.parse(sessionStorage.getItem("longFormCampaigns") || "[]");
    if (!pending.length) {
      console.warn("⚠️ Geen longform-campagnes gevonden om te versturen");
      submitting = false;
      return;
    }

    for (const camp of pending) {
      const payload = window.buildPayload(camp);
      await window.fetchLead(payload);
    }

    console.log("✅ Longform-leads verzonden");
    sessionStorage.removeItem("longFormCampaigns");
    submitting = false;
    document.dispatchEvent(new Event("longFormSubmitted"));
  });
});

// -------------------------------------------------------------
// 🔹 Sponsor-akkoord-tracking
// -------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const acceptBtn = document.getElementById("accept-sponsors-btn");
  if (!acceptBtn) return;
  acceptBtn.addEventListener("click", () => {
    sessionStorage.setItem("sponsorsAccepted", "true");
    console.log("✅ Sponsors akkoord: true");
  });
});
