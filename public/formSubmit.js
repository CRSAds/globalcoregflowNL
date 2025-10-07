// formSubmit.js — volledig afgestemd op dynamische coregRenderer.js

window.submittedCampaigns = window.submittedCampaigns || new Set();

// Trackingvelden uit URL opslaan bij pageload
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  ["t_id", "aff_id", "sub_id", "sub2", "offer_id"].forEach(key => {
    const val = urlParams.get(key);
    if (val) sessionStorage.setItem(key, val);
  });
});

function buildPayload(campaign = {}) {
  const t_id = sessionStorage.getItem("t_id") || crypto.randomUUID();
  const aff_id = sessionStorage.getItem("aff_id") || "";
  const sub_id = sessionStorage.getItem("sub_id") || "";
  const sub2 = sessionStorage.getItem("sub2") || "";
  const offer_id = sessionStorage.getItem("offer_id") || "";

  const campaignUrl = `${window.location.origin}${window.location.pathname}?status=online`;

  // Geboortedatum naar ISO-formaat
  const dob_day = sessionStorage.getItem("dob_day");
  const dob_month = sessionStorage.getItem("dob_month");
  const dob_year = sessionStorage.getItem("dob_year");
  const dob_iso =
    dob_year && dob_month && dob_day
      ? `${dob_year.padStart(4, "0")}-${dob_month.padStart(2, "0")}-${dob_day.padStart(2, "0")}`
      : "";

  // CID/SID — neem altijd van de campagne of fallback
  const cid = campaign.cid || "925";
  const sid = campaign.sid || "34";

  // Basispayload
  const payload = {
    cid,
    sid,
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
    sub2
  };

  // ===== Coreg antwoorden ophalen =====
  // key = coreg_answer_<campaign.id>
  if (campaign.coregAnswerKey) {
    payload.f_2014_coreg_answer = sessionStorage.getItem(campaign.coregAnswerKey) || "";
  }

  // universele fallback (als campaign.coregAnswerKey niet meegegeven is)
  const possibleKeys = Object.keys(sessionStorage).filter(k => k.startsWith("coreg_answer_"));
  if (!payload.f_2014_coreg_answer && possibleKeys.length > 0) {
    const latestKey = possibleKeys[possibleKeys.length - 1];
    payload.f_2014_coreg_answer = sessionStorage.getItem(latestKey);
  }

  // dropdown antwoord (indien aanwezig)
  const dropdownKeys = Object.keys(sessionStorage).filter(k => k.startsWith("dropdown_answer_"));
  if (dropdownKeys.length > 0) {
    const latestDropdown = dropdownKeys[dropdownKeys.length - 1];
    payload.f_2575_coreg_answer_dropdown = sessionStorage.getItem(latestDropdown);
  }

  console.log("📦 Payload opgebouwd:", payload);
  return payload;
}

async function fetchLead(payload) {
  const key = `${payload.cid}_${payload.sid}`;
  if (window.submittedCampaigns.has(key)) {
    console.log("✅ Lead al verzonden:", key);
    return { skipped: true };
  }

  try {
    const response = await fetch("/api/lead.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    let result = {};
    try {
      const text = await response.text();
      result = text ? JSON.parse(text) : {};
    } catch (parseErr) {
      console.warn("⚠️ Geen geldige JSON in response:", parseErr);
      result = {};
    }

    console.log("✅ API antwoord:", result);
    window.submittedCampaigns.add(key);
    return result;
  } catch (err) {
    console.error("❌ Fout bij lead versturen:", err);
    throw err;
  }
}

// Globaal beschikbaar
window.buildPayload = buildPayload;
window.fetchLead = fetchLead;

// =======================================
// Live form tracking: short + long form
// =======================================
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
  console.log("🧠 Live form tracking actief (short + long form).");
});
