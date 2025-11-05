// =============================================================
// ✅ formSubmit.js — unified versie met auto-jump DOB, IP-tracking,
// shortform (925) + co-sponsors + longform + CID/SID fix
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
  // 🔹 IP ophalen (1x per sessie)
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
  // 🔹 Payload opbouwen
  // -----------------------------------------------------------
  async function buildPayload(campaign = {}) {
    const ip = await getIpOnce();

    const t_id = sessionStorage.getItem("t_id") || crypto.randomUUID();
    const aff_id = sessionStorage.getItem("aff_id") || "unknown";
    const offer_id = sessionStorage.getItem("offer_id") || "unknown";
    const sub_id = sessionStorage.getItem("sub_id") || "unknown";
    const sub2 = sessionStorage.getItem("sub2") || "unknown";
    const campaignUrl = `${window.location.origin}${window.location.pathname}?status=online`;

    // ✅ DOB parsing
    const dobValue = sessionStorage.getItem("dob");
    let dob = "";
    if (dobValue && dobValue.includes("/")) {
      const [dd, mm, yyyy] = dobValue.split("/");
      if (dd && mm && yyyy) dob = `${yyyy}-${mm.padStart(2,"0")}-${dd.padStart(2,"0")}`;
    }

    // ✅ CID/SID fix — voorkom “undefined” strings
    let cid = campaign.cid;
    let sid = campaign.sid;
    if (cid === "undefined" || cid === undefined || cid === "") cid = null;
    if (sid === "undefined" || sid === undefined || sid === "") sid = null;

    const payload = {
      cid,
      sid,
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
      is_shortform: campaign.is_shortform || false,
    };

    // extra antwoorden meenemen (coreg of dropdown)
    if (campaign.f_2014_coreg_answer)
      payload.f_2014_coreg_answer = campaign.f_2014_coreg_answer;
    if (campaign.f_2575_coreg_answer_dropdown)
      payload.f_2575_coreg_answer_dropdown = campaign.f_2575_coreg_answer_dropdown;

    return payload;
  }
  window.buildPayload = buildPayload;

  // -----------------------------------------------------------
  // 🔹 Lead versturen
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
      return { success: false, error: err.message };
    }
  }
  window.fetchLead = fetchLead;

  // -----------------------------------------------------------
  // 🔹 Slim DOB veld — autojump
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
      let jumpToMonth = false, jumpToYear = false;
      if (val.length === 1 && parseInt(val[0], 10) >= 4) { val = "0" + val; jumpToMonth = true; }
      if (val.length === 3 && parseInt(val[2], 10) >= 2) { val = val.slice(0,2) + "0" + val.slice(2); jumpToYear = true; }

      const formatted = format(val);
      e.target.value = formatted;
      sessionStorage.setItem("dob", formatted.replace(/\s/g, ""));
      if (jumpToMonth && val.length === 2) {
        const pos = formatted.indexOf("/") + 3; e.target.setSelectionRange(pos, pos);
      } else if (jumpToYear && val.length === 4) {
        const pos = formatted.lastIndexOf("/") + 3; e.target.setSelectionRange(pos, pos);
      }
    });
  });

// -----------------------------------------------------------
// 🔹 Shortform — altijd naar 925 + co-sponsors bij akkoord
// -----------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("lead-form");
  if (!form) return;

  const btn = form.querySelector("button[type='submit'], .flow-next");
  if (!btn) return;

  // blokkeer SwipePages bij ongeldige invoer
  btn.addEventListener("click", (e) => {
    if (!form.checkValidity()) {
      form.reportValidity();
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    }
  }, true);

  let submitting = false;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    if (submitting) return;
    submitting = true;

    // waarden opslaan
    const genderEl = form.querySelector("input[name='gender']:checked");
    if (genderEl) sessionStorage.setItem("gender", genderEl.value);
    ["firstname","lastname","email","dob"].forEach(id=>{
      const el=document.getElementById(id);
      if(el){let v=(el.value||"").trim();if(id==="dob")v=v.replace(/\s/g,"");sessionStorage.setItem(id,v);}
    });

    // IP garanderen
    await getIpOnce();

    // 1️⃣ Hoofdlead — campagne 925 altijd versturen
    try {
      const basePayload = await buildPayload({ cid: "925", sid: "34", is_shortform: true });
      await fetchLead(basePayload);
      console.log("✅ Shortform lead verzonden (925/34)");
    } catch (err) {
      console.error("❌ Fout bij shortform lead:", err);
    }

    // 2️⃣ Co-sponsors alleen bij akkoord
    try {
      const accepted = sessionStorage.getItem("sponsorsAccepted") === "true";
      if (!accepted) {
        console.log("⚠️ Sponsors niet geaccepteerd — geen co-sponsors verzonden");
        submitting = false;
        return;
      }

      // co-sponsors ophalen
      const res = await fetch("https://globalcoregflow-nl.vercel.app/api/cosponsors.js", { cache: "no-store" });
      const json = await res.json();
      if (Array.isArray(json.data) && json.data.length) {
        console.log(`📡 Verstuur ${json.data.length} co-sponsors...`);
        await Promise.allSettled(json.data.map(async s => {
          if (!s.cid || !s.sid) return;
          const spPayload = await buildPayload({ cid: s.cid, sid: s.sid, is_shortform: true });
          await fetchLead(spPayload);
        }));
        console.log("✅ Alle co-sponsors verzonden");
      } else {
        console.log("ℹ️ Geen actieve co-sponsors gevonden");
      }
    } catch (err) {
      console.error("❌ Fout bij co-sponsors:", err);
    }
    document.dispatchEvent(new Event("shortFormSubmitted"));
    submitting = false;
  });
});

  // -----------------------------------------------------------
  // 🔹 Longform
  // -----------------------------------------------------------
  document.addEventListener("click", async (e) => {
    if (!e.target || !e.target.matches("#submit-long-form")) return;
    e.preventDefault();

    const form = document.getElementById("long-form");
    if (!form) return;

    const fields = ["postcode","straat","huisnummer","woonplaats","telefoon"];
    const invalid = fields.filter(id => !document.getElementById(id)?.value.trim());
    if (invalid.length) {
      alert("Vul alle verplichte velden in.");
      e.stopImmediatePropagation();
      return;
    }

    fields.forEach(id=>{
      const v=document.getElementById(id)?.value.trim()||"";
      if(v)sessionStorage.setItem(id,v);
    });

    const pending = JSON.parse(sessionStorage.getItem("longFormCampaigns") || "[]");
    if (!pending.length) { console.warn("⚠️ Geen longform campagnes"); return; }

    await getIpOnce();

    try {
      for (const camp of pending) {
        const coregAns = sessionStorage.getItem(`f_2014_coreg_answer_${camp.cid}`);
        const dropdownAns = sessionStorage.getItem(`f_2575_coreg_answer_dropdown_${camp.cid}`);
        const payload = await buildPayload({
          cid: camp.cid,
          sid: camp.sid,
          f_2014_coreg_answer: coregAns || undefined,
          f_2575_coreg_answer_dropdown: dropdownAns || undefined
        });
        await fetchLead(payload);
      }
      console.log("✅ Longform leads verzonden");
      sessionStorage.removeItem("longFormCampaigns");
      document.dispatchEvent(new Event("longFormSubmitted"));
    } catch (err) {
      console.error("❌ Fout bij longform:", err);
    }
  });

  // -----------------------------------------------------------
  // 🔹 Sponsor akkoord
  // -----------------------------------------------------------
  document.addEventListener("DOMContentLoaded", () => {
    const acceptBtn = document.getElementById("accept-sponsors-btn");
    if (!acceptBtn) return;
    acceptBtn.addEventListener("click", () => {
      sessionStorage.setItem("sponsorsAccepted", "true");
      console.log("✅ Sponsors akkoord");
    });
  });
}

// =============================================================
// ✅ coregRenderer.js FIX — bouw payload altijd met geldige CID/SID
// =============================================================
function buildCoregPayload(campaign, answerValue) {
  console.log("🧩 buildCoregPayload →", campaign.title, answerValue);

  // ⛑️ FIX: filter lege of “undefined” strings uit dataset
  if (answerValue?.cid === "undefined" || !answerValue?.cid) answerValue.cid = campaign.cid;
  if (answerValue?.sid === "undefined" || !answerValue?.sid) answerValue.sid = campaign.sid;

  const cid = answerValue.cid;
  const sid = answerValue.sid;
  const coregAnswer = answerValue.answer_value || answerValue || "";

  // Bewaar in sessionStorage
  sessionStorage.setItem(`f_2014_coreg_answer_${cid}`, coregAnswer);

  const payload = window.buildPayload({
    cid,
    sid,
    f_2014_coreg_answer: coregAnswer
  });
  return payload;
}
