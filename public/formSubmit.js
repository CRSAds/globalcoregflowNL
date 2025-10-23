// =============================================================
// formSubmit.js — met longform-fix + enkelvoudige feedback
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
    sub2: sessionStorage.getItem("sub2") || ""
  };

if (campaign.coregAnswerKey) {
  payload.f_2014_coreg_answer = sessionStorage.getItem(campaign.coregAnswerKey) || "";
}

// ✅ Dropdownwaarde meenemen — ook als die direct in sessionStorage staat
if (!payload.f_2575_coreg_answer_dropdown) {
  const directValue = sessionStorage.getItem("f_2575_coreg_answer_dropdown");
  if (directValue) {
    payload.f_2575_coreg_answer_dropdown = directValue;
    console.log("🔽 Dropdownwaarde toegevoegd aan payload (direct):", directValue);
  } else {
    const dropdownKeys = Object.keys(sessionStorage).filter(k => k.startsWith("dropdown_answer_"));
    if (dropdownKeys.length > 0) {
      const latest = dropdownKeys[dropdownKeys.length - 1];
      const dropdownValue = sessionStorage.getItem(latest);
      if (dropdownValue) {
        payload.f_2575_coreg_answer_dropdown = dropdownValue;
        console.log("🔽 Dropdownwaarde toegevoegd aan payload (fallback):", dropdownValue);
      }
    }
  }
}

console.log("📦 Payload opgebouwd:", payload);
return payload;

}

// --- Lead versturen ---
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

    console.log("✅ API antwoord:", result);
    window.submittedCampaigns.add(key);
    return result;
  } catch (err) {
    console.error("❌ Fout bij lead versturen:", err);
    return { success: false, error: err };
  }
}

// --- Globaal beschikbaar ---
window.buildPayload = buildPayload;
window.fetchLead = fetchLead;

// --- Live form tracking (short + long) ---
document.addEventListener("DOMContentLoaded", () => {
  const shortForm = document.querySelector("#lead-form");
  const longForm = document.querySelector("#long-form");
  const attach = form => {
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
  attach(shortForm);
  attach(longForm);
  console.log("🧠 Live form tracking actief (short + long form)");
});

// =============================================================
// 🟢 Shortform-lead naar campagne 925 + Co-sponsors
// =============================================================
document.addEventListener("DOMContentLoaded", () => {
  const shortForm = document.getElementById("lead-form");
  const acceptBtn = document.getElementById("accept-sponsors-btn");

  // 1️⃣ SHORTFORM versturen bij submit
  if (shortForm) {
    shortForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      console.log("📤 Shortform verzonden → campagne 925");

      // Basispayload bouwen
      const payload = window.buildPayload({ cid: 925, sid: 34 });
      await window.fetchLead(payload);

      // Sla shortformdata tijdelijk op voor co-sponsors
      sessionStorage.setItem("lastShortformPayload", JSON.stringify(payload));

      console.log("✅ Shortform lead verstuurd naar campagne 925");
    });
  }

  // 2️⃣ CO-SPONSORS activeren bij opt-in
  if (acceptBtn) {
    acceptBtn.addEventListener("click", async () => {
      console.log("✅ Algemene sponsoropt-in bevestigd → laad co-sponsors");

      try {
        const res = await fetch("https://globalcoregflow-nl.vercel.app/api/cosponsors.js");
        const { data } = await res.json();
        const coSponsors = (data || []).filter(s => s.is_live);

        const basePayload = JSON.parse(sessionStorage.getItem("lastShortformPayload") || "{}");
        if (!basePayload.cid) {
          console.warn("⚠️ Geen opgeslagen shortform-payload gevonden");
          return;
        }

        for (const sponsor of coSponsors) {
          const sponsorPayload = {
            ...basePayload,
            cid: sponsor.cid,
            sid: sponsor.sid,
          };

          console.log(`📨 Verstuur lead naar co-sponsor: ${sponsor.title}`, sponsorPayload);
          await window.fetchLead(sponsorPayload);
        }

        console.log("✅ Alle co-sponsor leads verzonden");
      } catch (err) {
        console.error("❌ Fout bij laden/versturen co-sponsors:", err);
      }
    });
  }
});

// --- Long Form submit handler ---
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("submit-long-form");
  const form = document.getElementById("long-form");
  if (!btn || !form) return;

  let submitting = false;

  btn.addEventListener("click", async () => {
    if (submitting) return; // voorkomt dubbele klik
    submitting = true;

    const fields = ["postcode", "straat", "huisnummer", "woonplaats", "telefoon"];
    const values = Object.fromEntries(fields.map(id => [id, document.getElementById(id)?.value.trim() || ""]));

    // Onvolledig ingevuld
    if (Object.values(values).some(v => !v)) {
      alert("Vul alle verplichte velden in voordat je doorgaat.");
      submitting = false;
      return;
    }

    // Opslaan in sessionStorage
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

    // ✅ In plaats van alert → trigger event
    document.dispatchEvent(new Event("longFormSubmitted"));
  });
});
