// =============================================================
// ✅ formSubmit.js — stabiele shortform + co-sponsor verzending (met enkel DOB-veld)
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

    // ✅ Nieuw: geboortedatum in 1 veld (dd/mm/jjjj)
    const dobValue = sessionStorage.getItem("dob");
    let dob_iso = "";
    if (dobValue && dobValue.includes("/")) {
      const [dd, mm, yyyy] = dobValue.split("/");
      if (dd && mm && yyyy) {
        dob_iso = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
      }
    }

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
  // 🔹 Live form tracking (short + long)
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

    // ✅ Nieuw: slimme DOB input handler
    const dobInput = document.getElementById("dob");
    if (dobInput) {
      dobInput.addEventListener("input", e => {
        let value = dobInput.value.replace(/\D/g, ""); // enkel cijfers
        if (value.length === 1 && parseInt(value) > 3) value = "0" + value;
        if (value.length > 2 && value[2] !== "/") value = value.slice(0, 2) + "/" + value.slice(2);

        const parts = value.split("/");
        if (parts[1] && parts[1].length === 1 && parseInt(parts[1]) > 1) {
          parts[1] = "0" + parts[1];
          value = parts.join("/");
        }

        if (value.length > 5 && value[5] !== "/") value = value.slice(0, 5) + "/" + value.slice(5);
        dobInput.value = value.slice(0, 10);
        sessionStorage.setItem("dob", dobInput.value);
      });

      dobInput.addEventListener("keypress", e => {
        if (!/[0-9]/.test(e.key)) e.preventDefault();
      });
    }
  });

  // -----------------------------------------------------------
  // 🔹 Shortform submit (ná geldige invoer) → 925 + co-sponsors
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

      // cache velden
      shortForm.querySelectorAll("input").forEach(input => {
        const name = input.name || input.id;
        if (name && input.value.trim()) sessionStorage.setItem(name, input.value.trim());
      });

      // hoofdlead
      const basePayload = buildPayload({ cid: "925", sid: "34", is_shortform: true });
      await fetchLead(basePayload);
      console.log("✅ Shortform lead verzonden naar campagne 925");

      // co-sponsors (alleen als akkoord eerder is gegeven)
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

      // ⚠️ Belangrijk: géén auto-click op .flow-next hier.
      // Swipe Pages regelt de sectiewissel al via de knop-click.
    });
  });

  // -------------------------------------------------------------
  // 🔹 Longform submit
  // -------------------------------------------------------------
  function waitForLongForm() {
    const btn = document.getElementById("submit-long-form");
    const form = document.getElementById("long-form");
    if (!btn || !form) {
      setTimeout(waitForLongForm, 300);
      return;
    }
    console.log("✅ Long form gevonden, listeners actief");

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

        // 🎯 Coreg-antwoorden toevoegen aan payload
        if (sessionStorage.getItem("f_2014_coreg_answer")) {
          payload.f_2014_coreg_answer = sessionStorage.getItem("f_2014_coreg_answer");
        }
        if (sessionStorage.getItem("f_2575_coreg_answer_dropdown")) {
          payload.f_2575_coreg_answer_dropdown = sessionStorage.getItem("f_2575_coreg_answer_dropdown");
        }

        console.log("📨 Longform payload naar Databowl:", payload);
        await window.fetchLead(payload);
      }

      console.log("✅ Longform-leads verzonden");
      sessionStorage.removeItem("longFormCampaigns");
      submitting = false;
      document.dispatchEvent(new Event("longFormSubmitted"));
    });
  }

  waitForLongForm();

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
