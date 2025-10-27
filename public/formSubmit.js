// =============================================================
// ✅ formSubmit.js — versie met global guard (1x listeners)
// =============================================================

if (!window.formSubmitInitialized) {
  window.formSubmitInitialized = true;
  window.submittedCampaigns = window.submittedCampaigns || new Set();

  // -----------------------------------------------------------
  // 🔹 Tracking opslaan bij pageload
  // -----------------------------------------------------------
  document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    ["t_id", "aff_id", "sub_id", "sub2", "offer_id"].forEach(key => {
      const val = urlParams.get(key);
      if (val) sessionStorage.setItem(key, val);
    });
  });

  // -----------------------------------------------------------
  // 🔹 Payload opbouwen
  // -----------------------------------------------------------
  function buildPayload(campaign = {}) {
    const t_id = sessionStorage.getItem("t_id") || crypto.randomUUID();
    const aff_id = sessionStorage.getItem("aff_id") || "unknown";
    const offer_id = sessionStorage.getItem("offer_id") || "unknown";
    const sub_id = sessionStorage.getItem("sub_id") || "unknown";
    const sub2 = sessionStorage.getItem("sub2") || "unknown";
    const campaignUrl = `${window.location.origin}${window.location.pathname}?status=online`;

    const dob_day = sessionStorage.getItem("dob_day");
    const dob_month = sessionStorage.getItem("dob_month");
    const dob_year = sessionStorage.getItem("dob_year");
    const dob_iso =
      dob_year && dob_month && dob_day
        ? `${dob_year.padStart(4, "0")}-${dob_month.padStart(2, "0")}-${dob_day.padStart(2, "0")}`
        : "";

    return {
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
  }

  window.buildPayload = buildPayload;

  // -----------------------------------------------------------
  // 🔹 Lead versturen naar Databowl
  // -----------------------------------------------------------
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

  window.fetchLead = fetchLead;

  // -----------------------------------------------------------
  // 🔹 Live form tracking
  // -----------------------------------------------------------
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

  // -----------------------------------------------------------
  // 🔹 Shortform submit (na geldig formulier)
  // -----------------------------------------------------------
  document.addEventListener("DOMContentLoaded", () => {
    const shortForm = document.querySelector("#lead-form");
    if (!shortForm) return;

    let shortFormSubmitted = false;

    shortForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (shortFormSubmitted) return;
      shortFormSubmitted = true;

      if (!shortForm.checkValidity()) {
        console.warn("⚠️ Formulier niet volledig ingevuld");
        shortForm.reportValidity();
        shortFormSubmitted = false;
        return;
      }

      console.log("🟢 Shortform verzonden...");

      shortForm.querySelectorAll("input").forEach(input => {
        const name = input.name || input.id;
        if (name && input.value.trim()) sessionStorage.setItem(name, input.value.trim());
      });

      const basePayload = buildPayload({ cid: "925", sid: "34", is_shortform: true });
      await fetchLead(basePayload);
      console.log("✅ Shortform lead verzonden naar campagne 925");

      const accepted = sessionStorage.getItem("sponsorsAccepted") === "true";
      if (accepted) {
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
      } else {
        console.log("⚠️ Voorwaarden niet geaccepteerd — alleen hoofdlead verzonden.");
      }

      // doorgaan naar volgende sectie
      const nextBtn = document.querySelector(".flow-next");
      if (nextBtn) {
        setTimeout(() => {
          console.log("➡️ Ga verder naar volgende sectie (Swipe Pages)");
          nextBtn.click();
        }, 400);
      }
    });
  });

  // -----------------------------------------------------------
  // 🔹 Sponsor akkoord tracking
  // -----------------------------------------------------------
  document.addEventListener("DOMContentLoaded", () => {
    const acceptBtn = document.getElementById("accept-sponsors-btn");
    if (!acceptBtn) return;
    acceptBtn.addEventListener("click", () => {
      sessionStorage.setItem("sponsorsAccepted", "true");
      console.log("✅ Sponsors akkoord: true");
    });
  });
}
