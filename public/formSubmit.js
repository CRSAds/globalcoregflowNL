// =============================================================
// formSubmit.js — shortform + co-sponsors + longform fix
// =============================================================

window.submittedCampaigns = window.submittedCampaigns || new Set();

// =============================================================
// 🔹 1. Trackingvelden uit URL opslaan
// =============================================================
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  ["t_id", "aff_id", "sub_id", "sub2", "offer_id"].forEach(key => {
    const val = urlParams.get(key);
    if (val) sessionStorage.setItem(key, val);
  });

  // 🔹 Sponsoropt-in knop opslaan
  const acceptBtn = document.getElementById("accept-sponsors-btn");
  if (acceptBtn) {
    acceptBtn.addEventListener("click", () => {
      sessionStorage.setItem("sponsorsAccepted", "true");
      console.log("✅ Sponsors akkoord bevestigd → co-sponsors worden actief na shortform submit");
    });
  }
});

// =============================================================
// 🔹 2. Payload bouwen
// =============================================================
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

  // Coreg answers meenemen
  if (campaign.coregAnswerKey) {
    payload.f_2014_coreg_answer = sessionStorage.getItem(campaign.coregAnswerKey) || "";
  }

  // Dropdownwaarde meenemen
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

// =============================================================
// 🔹 3. Lead versturen
// =============================================================
async function fetchLead(payload) {
  const key = `${payload.cid}_${payload.sid}`;
  if (window.submittedCampaigns.has(key)) {
    console.log("⚠️ Lead al eerder verstuurd:", key);
    return { skipped: true };
  }

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

    console.log(`✅ Lead verstuurd naar Databowl (cid:${payload.cid})`, result);
    window.submittedCampaigns.add(key);
    return result;
  } catch (err) {
    console.error("❌ Fout bij lead versturen:", err);
    return { success: false, error: err };
  }
}

// =============================================================
// 🔹 4. Shortform Submit
// =============================================================
document.addEventListener("DOMContentLoaded", () => {
  const shortForm = document.getElementById("lead-form");
  if (!shortForm) return;

  shortForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("📝 Shortform verstuurd → start leadverwerking");

    // Lead naar campagne 925
    const payload = buildPayload({ cid: 925, sid: 34 });
    await fetchLead(payload);

    const sponsorsAccepted = sessionStorage.getItem("sponsorsAccepted") === "true";

    if (sponsorsAccepted) {
      console.log("📢 Bezoeker accepteerde sponsors → co-sponsor leads verzenden");
      try {
        const res = await fetch("https://globalcoregflow-nl.vercel.app/api/cosponsors.js");
        const { data } = await res.json();
        const activeSponsors = data.filter(s => s.is_live && s.cid && s.sid);

        for (const s of activeSponsors) {
          const sponsorPayload = buildPayload({ cid: s.cid, sid: s.sid });
          await fetchLead(sponsorPayload);
          console.log(`📨 Co-sponsor lead verstuurd naar ${s.title}`);
        }
      } catch (err) {
        console.error("❌ Fout bij ophalen/versturen co-sponsors:", err);
      }
    } else {
      console.log("⚠️ Sponsors niet geaccepteerd → alleen hoofdlead (925) verzonden");
    }
  });
});

// =============================================================
// 🔹 5. Live form tracking (short + long)
// =============================================================
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
// 🔹 6. Longform Submit Handler
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
      const payload = buildPayload(camp);
      await fetchLead(payload);
    }

    console.log("✅ Longform-leads verzonden");
    sessionStorage.removeItem("longFormCampaigns");
    submitting = false;

    document.dispatchEvent(new Event("longFormSubmitted"));
  });
});
