// =============================================================
// ✅ formSubmit.js — één DOB-veld + browservalidatie + IP + short/longform
// =============================================================

if (!window.formSubmitInitialized) {
  window.formSubmitInitialized = true;
  window.submittedCampaigns = window.submittedCampaigns || new Set();

  // -----------------------------------------------------------
  // 🔹 Tracking parameters cachen bij pageload
  // -----------------------------------------------------------
  document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    ["t_id", "aff_id", "sub_id", "sub2", "offer_id"].forEach(key => {
      const val = urlParams.get(key);
      if (val) sessionStorage.setItem(key, val);
    });
  });

  // -----------------------------------------------------------
  // 🔹 Helper: IP ophalen (1x per sessie)
  // -----------------------------------------------------------
  async function getIpOnce() {
    let ip = sessionStorage.getItem("user_ip");
    if (ip) return ip;
    try {
      const res = await fetch("https://api.ipify.org?format=json", { cache: "no-store" });
      const data = await res.json();
      ip = data.ip || "0.0.0.0";
    } catch {
      ip = "0.0.0.0";
    }
    sessionStorage.setItem("user_ip", ip);
    return ip;
  }

  // -----------------------------------------------------------
  // 🔹 Payload opbouwen (neemt CID/SID exact over uit meegegeven campaign)
  // -----------------------------------------------------------
  async function buildPayload(campaign = {}) {
    const t_id     = sessionStorage.getItem("t_id")     || crypto.randomUUID();
    const aff_id   = sessionStorage.getItem("aff_id")   || "unknown";
    const offer_id = sessionStorage.getItem("offer_id") || "unknown";
    const sub_id   = sessionStorage.getItem("sub_id")   || "unknown";
    const sub2     = sessionStorage.getItem("sub2")     || "unknown";
    const ip       = await getIpOnce();

    const campaignUrl = `${window.location.origin}${window.location.pathname}?status=online`;

    // DOB: sessionStorage 'dob' staat in "dd/mm/jjjj" (zonder spaties)
    const dobValue = sessionStorage.getItem("dob");
    let dob = "";
    if (dobValue && dobValue.includes("/")) {
      const [dd, mm, yyyy] = dobValue.split("/");
      if (dd && mm && yyyy) dob = `${yyyy.padStart(4,"0")}-${mm.padStart(2,"0")}-${dd.padStart(2,"0")}`;
    }

    // ⚠️ Belangrijk: GEEN defaults voor coreg. Neem exact over wat je aanlevert.
    // Voor de hoofdlead geef je hieronder expliciet {cid:"925", sid:"34"} mee.
    const cid = campaign.cid;
    const sid = campaign.sid;

    const payload = {
      // campagne
      cid,
      sid,

      // short/long form data
      gender:     sessionStorage.getItem("gender")     || "",
      firstname:  sessionStorage.getItem("firstname")  || "",
      lastname:   sessionStorage.getItem("lastname")   || "",
      email:      sessionStorage.getItem("email")      || "",
      postcode:   sessionStorage.getItem("postcode")   || "",
      straat:     sessionStorage.getItem("straat")     || "",
      huisnummer: sessionStorage.getItem("huisnummer") || "",
      woonplaats: sessionStorage.getItem("woonplaats") || "",
      telefoon:   sessionStorage.getItem("telefoon")   || "",

      // tracking & meta
      dob,
      t_id,
      aff_id,
      offer_id,
      sub_id,
      sub2,
      f_1453_campagne_url: campaignUrl,
      f_17_ipaddress: ip,

      // flag
      is_shortform: !!campaign.is_shortform
    };

    // Eventuele coreg-answers (als caller ze wil meesturen)
    if (campaign.f_2014_coreg_answer) {
      payload.f_2014_coreg_answer = campaign.f_2014_coreg_answer;
    }
    if (campaign.f_2575_coreg_answer_dropdown) {
      payload.f_2575_coreg_answer_dropdown = campaign.f_2575_coreg_answer_dropdown;
    }

    return payload;
  }
  window.buildPayload = buildPayload;

  // -----------------------------------------------------------
  // 🔹 Lead versturen naar backend → Databowl
  // -----------------------------------------------------------
  async function fetchLead(payload) {
    if (!payload || !payload.cid || !payload.sid) {
      console.error("❌ fetchLead: ontbrekende cid/sid in payload:", payload);
      return { success: false, error: "Missing cid/sid" };
    }

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
      try { result = text ? JSON.parse(text) : {}; } catch { result = { raw: text }; }

      console.log(`📨 Lead verstuurd naar ${payload.cid}/${payload.sid}:`, result);
      window.submittedCampaigns.add(key);
      return result;
    } catch (err) {
      console.error("❌ Fout bij lead versturen:", err);
      return { success: false, error: err?.message || String(err) };
    }
  }
  window.fetchLead = fetchLead;

  // -----------------------------------------------------------
  // 🔹 Slim DOB-veld — auto-jump & opslag in sessionStorage
  // -----------------------------------------------------------
  document.addEventListener("DOMContentLoaded", () => {
    const dobInput = document.getElementById("dob");
    if (!dobInput) return;

    dobInput.placeholder = "dd / mm / jjjj";
    dobInput.inputMode = "numeric";
    dobInput.maxLength = 14;

    const format = (digits) => {
      let out = "";
      if (digits.length >= 1) out += digits[0];
      if (digits.length >= 2) out += digits[1];
      if (digits.length >= 2) out += " / ";
      if (digits.length >= 3) out += digits[2];
      if (digits.length >= 4) out += digits[3];
      if (digits.length >= 4) out += " / ";
      if (digits.length >= 5) out += digits[4];
      if (digits.length >= 6) out += digits[5];
      if (digits.length >= 7) out += digits[6];
      if (digits.length >= 8) out += digits[7];
      return out;
    };

    dobInput.addEventListener("input", (e) => {
      let val = e.target.value.replace(/\D/g, "").slice(0, 8);
      let jumpToMonth = false;
      let jumpToYear = false;

      if (val.length === 1 && parseInt(val[0], 10) >= 4) {
        val = "0" + val; jumpToMonth = true;
      }
      if (val.length === 3 && parseInt(val[2], 10) >= 2) {
        val = val.slice(0, 2) + "0" + val.slice(2); jumpToYear = true;
      }

      const formatted = format(val);
      e.target.value = formatted;
      sessionStorage.setItem("dob", formatted.replace(/\s/g, "")); // compact dd/mm/jjjj

      if (jumpToMonth && val.length === 2) {
        const pos = formatted.indexOf("/") + 3; e.target.setSelectionRange(pos, pos);
      } else if (jumpToYear && val.length === 4) {
        const pos = formatted.lastIndexOf("/") + 3; e.target.setSelectionRange(pos, pos);
      }
    });
  });

  // -----------------------------------------------------------
  // 🔹 Shortform: browservalidatie + veilige verzending
  //   - Blokkeert doorgaan bij invalid (stopImmediatePropagation)
  //   - Verstuurt hoofdlead (925/34) + co-sponsors bij valid
  // -----------------------------------------------------------
  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("lead-form");
    if (!form) return;

    // 1) Click-intercept op de "volgende" knop om SwipePages te blokkeren bij invalid
    const nextBtn = form.querySelector("button[type='submit'], .flow-next");
    if (nextBtn) {
      nextBtn.addEventListener("click", (e) => {
        if (!form.checkValidity()) {
          form.reportValidity();
          // Blokkeer elk ander click/next gedrag van Swipe of andere scripts
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        }
        // Bij geldig NIET blokkeren: SwipePages mag sectie-wissel doen.
      }, true); // capture = true → vóór SwipePages handlers
    }

    // 2) Echte submit handler: altijd preventDefault (we handelen zelf af)
    let shortFormSubmitting = false;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Safety: check nogmaals
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      if (shortFormSubmitting) return;
      shortFormSubmitting = true;

      // Cache inputs
      const genderEl = form.querySelector("input[name='gender']:checked");
      if (genderEl) sessionStorage.setItem("gender", genderEl.value);
      ["firstname","lastname","email","dob"].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        let v = (el.value || "").trim();
        if (id === "dob") v = v.replace(/\s/g, "");
        sessionStorage.setItem(id, v);
      });

      // IP pull garanderen
      await getIpOnce();

      // Hoofdlead (NL shortform 925/34)
      try {
        const basePayload = await buildPayload({ cid: "925", sid: "34", is_shortform: true });
        await fetchLead(basePayload);
        console.log("✅ Shortform (925/34) verzonden");
      } catch (err) {
        console.error("❌ Shortform lead fout:", err);
      }

      // Co-sponsors bij akkoord
      try {
        const accepted = sessionStorage.getItem("sponsorsAccepted") === "true";
        if (accepted) {
          const res = await fetch("https://globalcoregflow-nl.vercel.app/api/cosponsors.js", { cache: "no-store" });
          const json = await res.json();
          if (Array.isArray(json.data) && json.data.length) {
            await Promise.allSettled(json.data.map(async s => {
              if (!s.cid || !s.sid) return;
              const sp = await buildPayload({ cid: s.cid, sid: s.sid, is_shortform: true });
              await fetchLead(sp);
            }));
            console.log("✅ Co-sponsors verzonden:", json.data.length);
          } else {
            console.log("ℹ️ Geen actieve co-sponsors");
          }
        } else {
          console.log("⚠️ Sponsors niet geaccepteerd — skip co-sponsors");
        }
      } catch (err) {
        console.error("❌ Co-sponsors fout:", err);
      }

      shortFormSubmitting = false;
      // Geen verdere actie → SwipePages heeft bij geldige click al de sectie gewisseld.
    });
  });

  // -----------------------------------------------------------
  // 🔹 Longform: stabiele click-handler (werkt ook bij late rendering)
  // -----------------------------------------------------------
  document.addEventListener("click", async (e) => {
    if (!e.target || !e.target.matches("#submit-long-form")) return;

    const form = document.getElementById("long-form");
    if (!form) return;

    const fields = ["postcode", "straat", "huisnummer", "woonplaats", "telefoon"];
    const invalid = fields.filter(id => !document.getElementById(id)?.value.trim());
    if (invalid.length) {
      alert("Vul alle verplichte velden in.");
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return;
    }

    // Cache longform waarden
    fields.forEach(id => {
      const val = document.getElementById(id)?.value.trim() || "";
      if (val) sessionStorage.setItem(id, val);
    });

    // Pending longform-campagnes ophalen (gezet door coregRenderer)
    const pending = JSON.parse(sessionStorage.getItem("longFormCampaigns") || "[]");
    if (!pending.length) {
      console.warn("⚠️ Geen longform-campagnes gevonden om te versturen");
      return;
    }

    // IP garanderen
    await getIpOnce();

    try {
      for (const camp of pending) {
        // Coreg-answers (indien eerder gezet per CID) meenemen
        const coregAnswer = sessionStorage.getItem(`f_2014_coreg_answer_${camp.cid}`);
        const dropdownAnswer = sessionStorage.getItem(`f_2575_coreg_answer_dropdown_${camp.cid}`);

        const payload = await buildPayload({
          cid: camp.cid,
          sid: camp.sid,
          f_2014_coreg_answer: coregAnswer || undefined,
          f_2575_coreg_answer_dropdown: dropdownAnswer || undefined
        });

        await fetchLead(payload);
      }

      console.log("✅ Longform-leads verzonden");
      sessionStorage.removeItem("longFormCampaigns");
      document.dispatchEvent(new Event("longFormSubmitted"));
      // SwipePages kan nu de volgende sectie laten zien (eigen handler)

    } catch (err) {
      console.error("❌ Longform verzendfout:", err);
    }
  });

  // -----------------------------------------------------------
  // 🔹 Sponsor akkoord tracking (knop)
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
