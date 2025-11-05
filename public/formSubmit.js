// =============================================================
// ✅ formSubmit.js — unified versie met auto-jump DOB + JS-validatie + IP-tracking
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
  // 🔹 Payload opbouwen (inclusief IP)
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

    // ✅ DOB omzetten naar ISO (yyyy-mm-dd)
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
  // 🔹 Lead versturen
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
      try { result = text ? JSON.parse(text) : {}; } catch { result = { raw: text }; }
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
  // 🔹 Slim geboortedatumveld — auto jump binnen één input
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

    // 🚀 Auto-format + cursor spring
    dobInput.addEventListener("input", (e) => {
      let val = e.target.value.replace(/\D/g, "").slice(0, 8);
      let jumpToMonth = false;
      let jumpToYear = false;

      if (val.length === 1 && parseInt(val[0]) >= 4) {
        val = "0" + val;
        jumpToMonth = true;
      }
      if (val.length === 3 && parseInt(val[2]) >= 2) {
        val = val.slice(0, 2) + "0" + val.slice(2);
        jumpToYear = true;
      }

      const formatted = format(val);
      e.target.value = formatted;
      sessionStorage.setItem("dob", formatted.replace(/\s/g, ""));

      if (jumpToMonth && val.length === 2) {
        const pos = formatted.indexOf("/") + 3;
        e.target.setSelectionRange(pos, pos);
      } else if (jumpToYear && val.length === 4) {
        const pos = formatted.lastIndexOf("/") + 3;
        e.target.setSelectionRange(pos, pos);
      }
    });
  });

  // -----------------------------------------------------------
  // 🔹 Shortform validatie + verzending
  // -----------------------------------------------------------
  document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#lead-form");
    if (!form) return;
    form.setAttribute("novalidate", "true");

    const btn = form.querySelector("button[type='submit'], .flow-next");
    if (!btn) return;

    btn.addEventListener("click", async (e) => {
      e.preventDefault();

      // reset errors
      form.querySelectorAll(".error-text").forEach(el => el.remove());
      form.querySelectorAll("input").forEach(el => el.classList.remove("error"));

      const gender = form.querySelector("input[name='gender']:checked");
      const firstname = form.querySelector("#firstname")?.value.trim();
      const lastname = form.querySelector("#lastname")?.value.trim();
      const dob = form.querySelector("#dob")?.value.trim();
      const email = form.querySelector("#email")?.value.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      let hasError = false;

      const addError = (el, msg) => {
        if (!el) return;
        el.classList.add("error");
        const err = document.createElement("div");
        err.className = "error-text";
        err.textContent = msg;
        el.insertAdjacentElement("afterend", err);
      };

      if (!gender) { hasError = true; addError(form.querySelector(".gender-group"), "Kies een aanhef"); }
      if (!firstname) { hasError = true; addError(form.querySelector("#firstname"), "Voornaam is verplicht"); }
      if (!lastname) { hasError = true; addError(form.querySelector("#lastname"), "Achternaam is verplicht"); }
      if (!dob || dob.length < 10) { hasError = true; addError(form.querySelector("#dob"), "Geboortedatum is verplicht"); }
      if (!email || !emailRegex.test(email)) { hasError = true; addError(form.querySelector("#email"), "Voer een geldig e-mailadres in"); }

      if (hasError) {
        console.warn("⚠️ Formulier niet volledig of onjuist ingevuld");
        return; // stop flow
      }

      // waarden opslaan
      const genderValue = gender?.value || "";
      sessionStorage.setItem("gender", genderValue);
      sessionStorage.setItem("firstname", firstname);
      sessionStorage.setItem("lastname", lastname);
      sessionStorage.setItem("email", email);
      sessionStorage.setItem("dob", dob.replace(/\s/g, ""));

      console.log("🟢 Shortform verzonden...");

      // hoofdlead
      const payload = await buildPayload({ cid: "925", sid: "34", is_shortform: true });
      await fetchLead(payload);
      console.log("✅ Shortform lead verzonden");

      // co-sponsors (alleen als akkoord)
      const accepted = sessionStorage.getItem("sponsorsAccepted") === "true";
      if (accepted) {
        try {
          const res = await fetch("https://globalcoregflow-nl.vercel.app/api/cosponsors.js");
          const json = await res.json();
          if (json.data?.length) {
            console.log(`📡 Verstuur naar ${json.data.length} co-sponsors...`);
            await Promise.allSettled(json.data.map(async s => {
              if (!s.cid || !s.sid) return;
              const spPayload = await buildPayload({
                cid: s.cid,
                sid: s.sid,
                is_shortform: true
              });
              await fetchLead(spPayload);
            }));
          }
        } catch (err) {
          console.error("❌ Fout bij co-sponsors:", err);
        }
      } else {
        console.log("⚠️ Sponsors niet geaccepteerd — alleen hoofdlead verzonden.");
      }
    });
  });
}
