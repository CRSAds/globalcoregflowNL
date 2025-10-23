// =============================================================
// formSubmit.js — unified versie voor shortform, co-sponsors en coreg
// =============================================================

window.submittedCampaigns = window.submittedCampaigns || new Set();

// --- Trackingvelden uit URL opslaan ---
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  ["t_id", "aff_id", "sub_id", "sub2", "offer_id"].forEach(key => {
    const val = urlParams.get(key);
    if (val) sessionStorage.setItem(key, val);
  });
});

// --- Payload bouwen ---
function buildPayload(campaign = {}) {
  const t_id = sessionStorage.getItem("t_id") || crypto.randomUUID();
  const campaignUrl = `${window.location.origin}${window.location.pathname}?status=online`;

  const dob_day = sessionStorage.getItem("dob_day");
  const dob_month = sessionStorage.getItem("dob_month");
  const dob_year = sessionStorage.getItem("dob_year");
  const dob_iso =
    dob_year && dob_month && dob_day
      ? `${dob_year.padStart(4, "0")}-${dob_month.padStart(2, "0")}-${dob_day.padStart(2, "0")}`
      : "";

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
    f_1684_sub_id: sessionStorage.getItem("sub_id") || "",
    f_1685_aff_id: sessionStorage.getItem("aff_id") || "",
    f_1687_offer_id: sessionStorage.getItem("offer_id") || "",
    sub2: sessionStorage.getItem("sub2") || "",
    is_shortform: campaign.is_shortform || false
  };

  // coreg antwoorden
  if (campaign.coregAnswerKey) {
    payload.f_2014_coreg_answer = sessionStorage.getItem(campaign.coregAnswerKey) || "";
  }

  // dropdownwaarde (shortform of coreg)
  const dropdownKeys = Object.keys(sessionStorage).filter(k => k.startsWith("dropdown_answer_"));
  if (dropdownKeys.length > 0) {
    const latest = dropdownKeys[dropdownKeys.length - 1];
    const dropdownValue = sessionStorage.getItem(latest);
    if (dropdownValue) payload.f_2575_coreg_answer_dropdown = dropdownValue;
  }

  console.log("📦 Payload opgebouwd:", payload);
  return payload;
}

// --- Lead versturen ---
async function fetchLead(payload) {
  const key = `${payload.cid}_${payload.sid}`;
  if (window.submittedCampaigns.has(key)) {
    console.log("✅ Lead al verzonden:", key);
    return { skipped: true };
  }

  try {
    const response = await fetch("/api/lead.js", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    let result = {};
    try {
      result = text ? JSON.parse(text) : {};
    } catch {
      result = { raw: text };
    }

    console.log("✅ API antwoord:", result);
    window.submittedCampaigns.add(key);
    return result;
  } catch (err) {
    console.error("❌ Fout bij lead versturen:", err);
    return { success: false, error: err };
  }
}

// Globaal beschikbaar
window.buildPayload = buildPayload;
window.fetchLead = fetchLead;

// --- Live form tracking ---
document.addEventListener("DOMContentLoaded", () => {
  const shortForm = document.querySelector("#lead-form");
  const longForm = document.querySelector("#long-form");

  const attachListeners = (form) => {
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
  };

  attachListeners(shortForm);
  attachListeners(longForm);
  console.log("🧠 Live form tracking actief (short + long form)");
});

// =============================================================
// 🚀 Shortform submit handler (hoofdlead + co-sponsors)
// =============================================================
document.addEventListener("DOMContentLoaded", () => {
  const shortForm = document.querySelector("#lead-form");
  const submitBtn = document.querySelector("#submit-short-form");

  if (!shortForm || !submitBtn) return;

  submitBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    console.log("🟢 Shortform verzonden...");

    // Opslaan van shortform velden
    shortForm.querySelectorAll("input").forEach(input => {
      const name = input.name || input.id;
      if (name && input.value.trim()) sessionStorage.setItem(name, input.value.trim());
    });

    // Bouw hoofdlead-payload (campagne 925)
    const basePayload = buildPayload({ cid: "925", sid: "34", is_shortform: true });
    await fetchLead(basePayload);
    console.log("✅ Shortform hoofdlead (925) verzonden");

    // Check of voorwaarden geaccepteerd zijn
    const accepted = sessionStorage.getItem("sponsorsAccepted") === "true";
    if (!accepted) {
      console.log("⚠️ Voorwaarden niet geaccepteerd → alleen 925 verzonden");
      return;
    }

    // Haal co-sponsors op vanuit API
    try {
      const res = await fetch("/api/cosponsors.js");
      const json = await res.json();

      if (json.data && json.data.length > 0) {
        console.log(`📡 Verstuur naar ${json.data.length} co-sponsors...`);
        for (const sponsor of json.data) {
          if (!sponsor.cid || !sponsor.sid) continue;
          const sponsorPayload = buildPayload({
            cid: sponsor.cid,
            sid: sponsor.sid,
            is_shortform: true
          });
          await fetchLead(sponsorPayload);
        }
      } else {
        console.log("ℹ️ Geen actieve co-sponsors gevonden.");
      }
    } catch (err) {
      console.error("❌ Fout bij ophalen/versturen co-sponsors:", err);
    }
  });
});

// =============================================================
// Longform submit handler (coreg longform)
// =============================================================
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

// =============================================================
// 📩 Voorwaarden (sponsoroptin) tracking
// =============================================================
document.addEventListener("DOMContentLoaded", () => {
  const acceptBtn = document.getElementById("accept-sponsors-btn");
  if (!acceptBtn) return;

  acceptBtn.addEventListener("click", () => {
    sessionStorage.setItem("sponsorsAccepted", "true");
    console.log("✅ Sponsors akkoord: true");
  });
});
