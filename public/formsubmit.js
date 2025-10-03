// formSubmit.js
import sponsorCampaigns from "./sponsorCampaigns.js";

window.submittedCampaigns = window.submittedCampaigns || new Set();

// Trackingvelden uit URL opslaan
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  ["t_id", "aff_id", "sub_id", "sub2", "offer_id"].forEach(key => {
    const val = urlParams.get(key);
    if (val) sessionStorage.setItem(key, val);
  });
});

export function buildPayload(campaign) {
  const t_id = sessionStorage.getItem("t_id") || crypto.randomUUID();
  const aff_id = sessionStorage.getItem("aff_id") || "";
  const sub_id = sessionStorage.getItem("sub_id") || "";
  const sub2 = sessionStorage.getItem("sub2") || "";
  const offer_id = sessionStorage.getItem("offer_id") || "";

  const campaignUrl = `${window.location.origin}${window.location.pathname}?status=online`;

  const dob_day = sessionStorage.getItem("dob_day");
  const dob_month = sessionStorage.getItem("dob_month");
  const dob_year = sessionStorage.getItem("dob_year");
  const dob_iso =
    dob_year && dob_month && dob_day
      ? `${dob_year.padStart(4, "0")}-${dob_month.padStart(2, "0")}-${dob_day.padStart(2, "0")}`
      : "";

  return {
    cid: campaign.cid || 925, // short form default naar 925
    sid: campaign.sid || 34,
    gender: sessionStorage.getItem("gender"),
    firstname: sessionStorage.getItem("firstname"),
    lastname: sessionStorage.getItem("lastname"),
    email: sessionStorage.getItem("email"),
    dob_day,
    dob_month,
    dob_year,
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
}

export async function fetchLead(payload) {
  const key = `${payload.cid}_${payload.sid}`;
  if (window.submittedCampaigns.has(key)) {
    console.log("✅ Lead al verzonden:", key);
    return { skipped: true };
  }

  try {
    const response = await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    console.log("✅ API antwoord:", result);
    window.submittedCampaigns.add(key);
    return result;
  } catch (err) {
    console.error("❌ Fout bij lead versturen:", err);
    throw err;
  }
}
