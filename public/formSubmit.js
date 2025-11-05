// =============================================================
// ✅ formSubmit.js — stabiele shortform + co-sponsor verzending
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
  // 🔹 Payload opbouwen (met IP-adres)
  // -----------------------------------------------------------
  async function buildPayload(campaign = {}) {
    const t_id = sessionStorage.getItem("t_id") || crypto.randomUUID();
    const aff_id = sessionStorage.getItem("aff_id") || "unknown";
    const offer_id = sessionStorage.getItem("offer_id") || "unknown";
    const sub_id = sessionStorage.getItem("sub_id") || "unknown";
    const sub2 = sessionStorage.getItem("sub2") || "unknown";
    const campaignUrl = `${window.location.origin}${window.location.pathname}?status=online`;

    // ✅ IP-adres ophalen (1x per sessie)
    let ip = sessionStorage.getItem("user_ip");
    if (!ip) {
      try {
        const res = await fetch("https://api.ipify.org?format=json");
        const data = await res.json();
        ip = data.ip;
        sessionStorage.setItem("user_ip", ip);
      } catch {
        ip = "0.0.0.0";
      }
    }

    // ✅ Geboortedatum in ISO 8601 (yyyy-mm-dd)
    const dobValue = sessionStorage.getItem("dob");
    let dob = "";
    if (dobValue && dobValue.includes("/")) {
      const [rawDD, rawMM, rawYYYY] = dobValue.split("/");
      const dd = (rawDD || "").replace(/\s/g, "");
      const mm = (rawMM || "").replace(/\s/g, "");
      const yyyy = (rawYYYY || "").replace(/\s/g, "");
      if (dd && mm && yyyy) dob = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
    }

    return {
      cid: campaign.cid || "925",
      sid: campaign.sid || "34",
      gender: sessionStorage.getItem("gender") || "",
      firstname: sessionStorage.getItem("firstname") || "",
      lastname: sessionStorage.getItem("lastname") || "",
      email: sessionStorage.getItem("email") || "",
      postcode: sessionStorage.getItem("postcode") || "",
      straat: sessionStorage.getItem("straat") || "",
      huisnummer: sessionStorage.getItem("huisnummer") || "",
      woonplaats: sessionStorage.getItem("woonplaats") || "",
      telefoon: sessionStorage.getItem("telefoon") || "",
      dob,
      t_id,
      aff_id,
      offer_id,
      sub_id,
      sub2,
      f_1453_campagne_url: campaignUrl,
      f_17_ipaddress: ip,
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
    if (!shortForm) return;
    shortForm.querySelectorAll("input").forEach(input => {
      const name = input.name || input.id;
      if (!name) return;
      const save = () => {
        if (input.type === "radio" && !input.checked) return;
        sessionStorage.setItem(name, (input.value || "").trim());
      };
      input.addEventListener("input", save);
      input.addEventListener("change", save);
    });
  });

  // -----------------------------------------------------------
  // 🔹 Slimme DOB input handler — met auto-jump teruggezet
  // -----------------------------------------------------------
  document.addEventListener("DOMContentLoaded", () => {
    const dobInput = document.getElementById("dob");
    if (!dobInput) return;

    dobInput.setAttribute("placeholder", "dd / mm / jjjj");
    dobInput.setAttribute("inputmode", "numeric");
    dobInput.setAttribute("maxlength", "14");

    const formatWithSpaces = (digits) => {
      let out = "";
      const len = digits.length;
      if (len >= 1) out += digits[0];
      if (len >= 2) out += digits[1];
      if (len >= 2) out += " / ";
      if (len >= 3) out += digits[2];
      if (len >= 4) out += digits[3];
      if (len >= 4) out += " / ";
      if (len >= 5) out += digits[4];
      if (len >= 6) out += digits[5];
      if (len >= 7) out += digits[6];
      if (len >= 8) out += digits[7];
      return out;
    };

    // ✅ Auto-jump logica
    dobInput.addEventListener("input", () => {
      let digits = dobInput.value.replace(/\D/g, "").slice(0, 8);
      let jumpToMonth = false;
      let jumpToYear = false;

      if (digits.length === 1 && parseInt(digits[0], 10) >= 4) {
        digits = "0" + digits;
        jumpToMonth = true;
      }
      if (digits.length === 3 && parseInt(digits[2], 10) >= 2) {
        digits = digits.slice(0, 2) + "0" + digits.slice(2);
        jumpToYear = true;
      }

      const formatted = formatWithSpaces(digits);
      dobInput.value = formatted;
      sessionStorage.setItem("dob", formatted.replace(/\s/g, ""));

      if (jumpToMonth && digits.length === 2) {
        const pos = formatted.indexOf("/") + 3;
        dobInput.setSelectionRange(pos, pos);
      } else if (jumpToYear && digits.length === 4) {
        const pos = formatted.lastIndexOf("/") + 3;
        dobInput.setSelectionRange(pos, pos);
      }
    });
  });

  // -----------------------------------------------------------
  // 🔹 Shortform submit — JS-validatie + IP + co-sponsors
  // -----------------------------------------------------------
  document.addEventListener("DOMContentLoaded", () => {
    const shortForm = document.querySelector("#lead-form");
    if (!shortForm) return;

    shortForm.setAttribute("novalidate", "true");
    let shortFormSubmitted = false;

    shortForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (shortFormSubmitted) return;

      // 🧹 Reset fouten
      shortForm.querySelectorAll(".error-text").forEach(el => el.remove());
      shortForm.querySelectorAll("input").forEach(el => el.classList.remove("error"));

      const requiredFields = ["gender", "firstname", "lastname", "dob", "email"];
      let hasError = false;

      requiredFields.forEach(id => {
        const el = document.getElementById(id);
        if (el && !el.value.trim()) {
          hasError = true;
          el.classList.add("error");
          const err = document.createElement("div");
          err.className = "error-text";
          err.textContent = "Dit veld is verplicht";
          el.insertAdjacentElement("afterend", err);
        }
      });

      // ✅ E-mail check
      const emailInput = document.getElementById("email");
      if (emailInput) {
        const val = emailInput.value.trim();
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (val && !regex.test(val)) {
          hasError = true;
          emailInput.classList.add("error");
          const err = document.createElement("div");
          err.className = "error-text";
          err.textContent = "Voer een geldig e-mailadres in";
          emailInput.insertAdjacentElement("afterend", err);
        }
      }

      if (hasError) {
        console.warn("⚠️ Formulier niet volledig of onjuist ingevuld");
        shortFormSubmitted = false;
        return; // ✅ STOP hier, ga NIET verder
      }

      shortFormSubmitted = true;
      console.log("🟢 Shortform verzonden...");

      // ✅ Gegevens opslaan
      shortForm.querySelectorAll("input").forEach(input => {
        const name = input.name || input.id;
        if (!name) return;
        let val = (input.value || "").trim();
        if (name === "dob") val = val.replace(/\s/g, "");
        if (val) sessionStorage.setItem(name, val);
      });

      // ✅ Hoofdlead verzenden
      const basePayload = await buildPayload({ cid: "925", sid: "34", is_shortform: true });
      await fetchLead(basePayload);

      // ✅ Co-sponsors
      const accepted = sessionStorage.getItem("sponsorsAccepted") === "true";
      if (accepted) {
        try {
          const res = await fetch("https://globalcoregflow-nl.vercel.app/api/cosponsors.js");
          const json = await res.json();
          if (json.data?.length) {
            console.log(`📡 Verstuur naar ${json.data.length} co-sponsors...`);
            await Promise.allSettled(json.data.map(async s => {
              if (!s.cid || !s.sid) return;
              const sponsorPayload = await buildPayload({
                cid: s.cid,
                sid: s.sid,
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

      shortFormSubmitted = false;
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
