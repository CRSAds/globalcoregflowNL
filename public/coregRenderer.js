// coregRenderer.js
// Renderer + flow logica met progressbar bovenin het witte kader
// Bij TM-positief/negatief klikken we de bestaande SwipePages flow-next knoppen,
// zodat de huidige sectie sluit en de juiste volgende sectie opent.

// ✅ Fix: gebruik let en check of het al bestaat, om "already declared" te voorkomen
if (typeof window.API_COREG === "undefined") {
  window.API_COREG = "https://globalcoregflow-nl.vercel.app/api/coreg.js";
}
const API_COREG = window.API_COREG;

function getImageUrl(image) {
  if (!image) return "https://via.placeholder.com/600x200?text=Geen+afbeelding";
  return image.id
    ? `https://cms.core.909play.com/assets/${image.id}`
    : image.url || "https://via.placeholder.com/600x200?text=Geen+afbeelding";
}

// === Logging helper ===
function logCoregSystemCheck() {
  console.groupCollapsed("🧩 Global CoregFlow System Check");
  const required = [
    { name: "formSubmit.js", ok: !!window.buildPayload && !!window.fetchLead },
    { name: "coregRenderer.js", ok: true },
    { name: "progressbar-anim.js", ok: !!window.animateProgressBar },
    { name: "initFlow-lite.js", ok: typeof window.initCoregFlow !== "undefined" },
    { name: "IVR", ok: typeof window.initIVR !== "undefined" },
    { name: "Memory", ok: !!window.localStorage }
  ];
  required.forEach(r => {
    if (r.ok) console.log(`✅ ${r.name} is geladen`);
    else console.warn(`⚠️ ${r.name} geladen → ontbreekt of niet actief.`);
  });
  console.groupEnd();
}
document.addEventListener("DOMContentLoaded", logCoregSystemCheck);

// =======================================
// Fetch campagnes vanuit Directus endpoint
// =======================================
async function fetchCampaigns() {
  try {
    const res = await fetch(API_COREG);
    if (!res.ok) throw new Error(`Kon campagnes niet laden (status ${res.status})`);
    const json = await res.json();
    console.log("📦 Campagnes geladen uit Directus:", json.data?.length || 0);
    return json.data;
  } catch (err) {
    console.error("❌ Fout bij laden coreg campagnes:", err);
    return [];
  }
}

// =======================================
// Verbeterde fetchLead wrapper (extra logging)
// =======================================
async function sendLeadToDatabowl(payload) {
  try {
    const result = await window.fetchLead(payload);
    const leadId = result?.result?.data?.id || result?.lead_id || result?.id || "onbekend";
    console.log(
      `%c✅ Lead verzonden naar Databowl`,
      "color:green;font-weight:bold;",
      { cid: payload.cid, sid: payload.sid, leadId, fullResult: result }
    );
    return result;
  } catch (err) {
    console.error("❌ Fout bij versturen lead naar Databowl:", err);
    return null;
  }
}

// =======================================
// Progressbar (style 1 — groen)
// =======================================
function renderProgressBar(progress = 0) {
  return `
    <div class="ld-progress-wrap mb-25">
      <div class="ld-progress-info">
        <span class="progress-label">Je bent er bijna</span>
        <span class="progress-value text-primary">${progress}%</span>
      </div>
      <div class="ld-progress lh-8" role="progressbar" data-progress="${progress}">
        <div class="progress-bar" style="width:${progress}%;"></div>
      </div>
    </div>`;
}

// =======================================
// Campaign renders
// =======================================
function renderSingle(campaign, isFinal) {
  return `
    <div class="coreg-section ${isFinal ? "final-coreg" : ""}" id="campaign-${campaign.id}">
      <img src="${getImageUrl(campaign.image)}" alt="${campaign.title}" class="coreg-image" />
      <h3 class="coreg-title">${campaign.title}</h3>
      <p class="coreg-description">${campaign.description}</p>
      <div class="coreg-answers">
${campaign.coreg_answers
  .map(ans => `
    <button class="flow-next btn-answer"
            data-answer="yes"
            data-campaign="${campaign.id}"
            data-cid="${campaign.cid}"
            data-sid="${campaign.sid}">
      ${ans.label}
    </button>`
  ).join("")}
<button class="flow-next btn-skip"
        data-answer="no"
        data-campaign="${campaign.id}">
  Nee, geen interesse
</button>
      </div>
    </div>`;
}

function renderDropdown(campaign, isFinal) {
  const answers = campaign.coreg_answers || [];

  return `
    <div class="coreg-section ${isFinal ? "final-coreg" : ""}" id="campaign-${campaign.id}">
      <img src="${getImageUrl(campaign.image)}" alt="${campaign.title}" class="coreg-image" />
      <h3 class="coreg-title">${campaign.title}</h3>
      <p class="coreg-description">${campaign.description || ""}</p>
      <select class="coreg-dropdown"
              data-campaign="${campaign.id}"
              data-cid="${campaign.cid || ""}"
              data-sid="${campaign.sid || ""}">
        <option value="">Maak een keuze...</option>
        ${answers.map(opt => `
          <option value="${opt.answer_value}"
                  data-cid="${opt.has_own_campaign ? opt.cid : campaign.cid}"
                  data-sid="${opt.has_own_campaign ? opt.sid : campaign.sid}">
            ${opt.label}
          </option>`).join("")}
      </select>
      <a href="#" class="skip-link" data-answer="no" data-campaign="${campaign.id}">Geen interesse, sla over</a>
    </div>`;
}

function renderMultistep(campaign, isFinal) {
  let dropdownCampaign = campaign;

  // Pak stap 2 campaign uit Directus (zelfde cid, step=2)
  if (window.allCampaigns && Array.isArray(window.allCampaigns)) {
    const found = window.allCampaigns.find(c => c.cid === campaign.cid && c.step === 2);
    if (found) dropdownCampaign = found;
  }

  const dropdownOptions = (dropdownCampaign.coreg_answers || []);

  // Stap 1 = altijd buttons
  const step1 = `
    <div class="coreg-section" id="campaign-${campaign.id}-step1">
      <img src="${getImageUrl(campaign.image)}" alt="${campaign.title}" class="coreg-image" />
      <h3 class="coreg-title">${campaign.title}</h3>
      <p class="coreg-description">${campaign.description}</p>
      <div class="coreg-answers">
        <button class="flow-next sponsor-next next-step-campaign-${campaign.id}-step2"
                data-answer="yes"
                data-campaign="${campaign.id}"
                data-cid="${campaign.cid}"
                data-sid="${campaign.sid}">
          Ja, graag
        </button>
        <button class="flow-next skip-next btn-skip"
                data-answer="no"
                data-campaign="${campaign.id}">
          Nee, geen interesse
        </button>
      </div>
    </div>`;

  // Stap 2 = afhankelijk van ui_style dropdownCampaign
  let step2Content = "";
  if (dropdownCampaign.ui_style === "dropdown") {
    step2Content = `
      <div class="coreg-section ${isFinal ? "final-coreg" : ""}"
           id="campaign-${dropdownCampaign.id}-step2"
           style="display:none">
        <img src="${getImageUrl(dropdownCampaign.image)}" alt="${dropdownCampaign.title}" class="coreg-image" />
        <h3 class="coreg-title">${dropdownCampaign.title}</h3>
        <select class="coreg-dropdown"
                data-campaign="${dropdownCampaign.id}"
                data-cid="${dropdownCampaign.cid}"
                data-sid="${dropdownCampaign.sid}">
          <option value="">Maak een keuze...</option>
          ${dropdownOptions.map(opt => `<option value="${opt.answer_value}">${opt.label}</option>`).join("")}
        </select>
        <a href="#" class="skip-link" data-answer="no" data-campaign="${dropdownCampaign.id}">Toch geen interesse</a>
      </div>`;
  } else {
    step2Content = `
      <div class="coreg-section ${isFinal ? "final-coreg" : ""}"
           id="campaign-${dropdownCampaign.id}-step2"
           style="display:none">
        <img src="${getImageUrl(dropdownCampaign.image)}" alt="${dropdownCampaign.title}" class="coreg-image" />
        <h3 class="coreg-title">${dropdownCampaign.title}</h3>
        <div class="coreg-answers">
          ${dropdownOptions.map(opt => `
            <button class="flow-next"
                    data-answer="${opt.answer_value}"
                    data-campaign="${dropdownCampaign.id}"
                    data-cid="${opt.has_own_campaign ? opt.cid : dropdownCampaign.cid}"
                    data-sid="${opt.has_own_campaign ? opt.sid : dropdownCampaign.sid}">
              ${opt.label}
            </button>
          `).join("")}
        </div>
      </div>`;
  }

  return step1 + step2Content;
}

function renderCampaign(campaign, isFinal) {
  // Multistep blijft zoals het was
  if (campaign.hasCoregFlow) return renderMultistep(campaign, isFinal);

  // Check ui_style
  if (campaign.ui_style === "dropdown") {
    return renderDropdown(campaign, isFinal);
  }

  // Default = buttons
  return renderSingle(campaign, isFinal);
}

// =======================================
// Lead functies met console logging
// =======================================

async function sendLead(cid, sid, answer, isTM = false) {
  try {
    // sla antwoord op voor coregAnswerKey
    if (answer) {
      sessionStorage.setItem(`coreg_answer_${cid}_${sid}`, answer);
    }

    const payload = window.buildPayload({ cid, sid });
    console.log("[coreg] sendLead()", { cid, sid, answer, isTM, payload });

    if (isTM) {
      let tmLeads = JSON.parse(sessionStorage.getItem("pendingTMLeads") || "[]");
      tmLeads = tmLeads.filter(l => l.cid !== cid || l.sid !== sid);
      tmLeads.push(payload);
      sessionStorage.setItem("pendingTMLeads", JSON.stringify(tmLeads));
      console.log("[coreg] TM lead opgeslagen in pendingTMLeads:", tmLeads);
      return;
    }

    const result = await sendLeadToDatabowl(payload);
    console.log("[coreg] EM lead direct verstuurd:", { payload, result });
  } catch (err) {
    console.error("[coreg] Fout bij sendLead:", err);
  }
}

async function sendAllTMLeads() {
  const tmLeads = JSON.parse(sessionStorage.getItem("pendingTMLeads") || "[]");
  console.log("[coreg] sendAllTMLeads gestart. Leads gevonden:", tmLeads);

  for (const lead of tmLeads) {
    try {
      const result = await window.fetchLead(lead);
      console.log("[coreg] TM lead verstuurd:", { lead, result });
    } catch (err) {
      console.error("[coreg] Fout bij versturen TM lead:", err);
    }
  }

  sessionStorage.removeItem("pendingTMLeads");
  console.log("[coreg] pendingTMLeads geleegd");
}

// =======================================
// Init flow (volledige versie met fixes)
// =======================================
async function initCoregFlow() {
  const container = document.getElementById("coreg-container");
  if (!container) return;

// =======================================
// Zorg dat formdata altijd beschikbaar is in sessionStorage
// (geldt voor zowel short form als long form)
// =======================================
function ensureFormDataInSession() {
  const shortForm = document.querySelector("#lead-form");
  const longForm = document.querySelector("#long-form");

  const fieldsShort = ["gender", "firstname", "lastname", "email", "dob_day", "dob_month", "dob_year"];
  const fieldsLong = ["postcode", "straat", "huisnummer", "woonplaats", "telefoon"];

  let missingShort = fieldsShort.filter(f => !sessionStorage.getItem(f));
  let missingLong = fieldsLong.filter(f => !sessionStorage.getItem(f));

  if (missingShort.length > 0 || missingLong.length > 0) {
    console.warn("⚠️ Niet alle formvelden in sessionStorage, probeer herstel...");

    // 🔹 Herstel vanuit short form
    if (shortForm) {
      sessionStorage.setItem("gender", shortForm.querySelector("input[name='gender']:checked")?.value || "");
      sessionStorage.setItem("firstname", shortForm.querySelector("#firstname")?.value || "");
      sessionStorage.setItem("lastname", shortForm.querySelector("#lastname")?.value || "");
      sessionStorage.setItem("email", shortForm.querySelector("#email")?.value || "");
      sessionStorage.setItem("dob_day", shortForm.querySelector("#dob-day")?.value || "");
      sessionStorage.setItem("dob_month", shortForm.querySelector("#dob-month")?.value || "");
      sessionStorage.setItem("dob_year", shortForm.querySelector("#dob-year")?.value || "");
    }

    // 🔹 Herstel vanuit long form
    if (longForm) {
      sessionStorage.setItem("postcode", longForm.querySelector("#postcode")?.value || "");
      sessionStorage.setItem("straat", longForm.querySelector("#straat")?.value || "");
      sessionStorage.setItem("huisnummer", longForm.querySelector("#huisnummer")?.value || "");
      sessionStorage.setItem("woonplaats", longForm.querySelector("#woonplaats")?.value || "");
      sessionStorage.setItem("telefoon", longForm.querySelector("#telefoon")?.value || "");
    }

    console.log("✅ Formdata hersteld uit DOM:", {
      shortForm: Object.fromEntries(fieldsShort.map(f => [f, sessionStorage.getItem(f)])),
      longForm: Object.fromEntries(fieldsLong.map(f => [f, sessionStorage.getItem(f)]))
    });
  } else {
    console.log("✅ Formdata al aanwezig in sessionStorage.");
  }

  // 👇 Live updates voor beide formulieren
  [shortForm, longForm].forEach(form => {
    if (!form) return;
    form.querySelectorAll("input").forEach(input => {
      const name = input.name || input.id;
      if (!name) return;

      const saveValue = () => {
        if (input.type === "radio" && !input.checked) return;
        sessionStorage.setItem(name, input.value);
      };

      input.addEventListener("input", saveValue);
      input.addEventListener("change", saveValue);
    });
  });

  console.log("🔄 Live form tracking actief voor short + long form.");
}

  const campaigns = await fetchCampaigns();
  window.allCampaigns = campaigns;

  // 🔔 coregReady event sturen zodat initFlow-lite kan starten
document.dispatchEvent(new CustomEvent("coregReady", {
  detail: { campaigns }
}));
console.log("✅ coregReady event verstuurd naar initFlow-lite.js");

  // Eén wit kader met progressbar bovenin
  container.innerHTML = `
    <div class="coreg-inner">
      ${renderProgressBar(0)}
      <div id="coreg-sections"></div>
    </div>
  `;

  const sectionsContainer = container.querySelector("#coreg-sections");

  // ✅ Fix 1: filter step=2 uit bij multistep campagnes
  const filteredCampaigns = campaigns.filter(c => {
    if (c.hasCoregFlow && Number(c.step) === 2) {
      const hasStep1 = campaigns.some(p => p.hasCoregFlow && p.cid === c.cid && Number(p.step) === 1);
      if (hasStep1) return false;
    }
    return true;
  });

  filteredCampaigns.forEach((camp, i) => {
    const isFinal = i === filteredCampaigns.length - 1;
    sectionsContainer.innerHTML += renderCampaign(camp, isFinal);
  });

  const sections = Array.from(sectionsContainer.querySelectorAll(".coreg-section"));
  sections.forEach((s, i) => (s.style.display = i === 0 ? "block" : "none"));

  // Progressbar updaten
  function updateProgressBar(sectionIdx) {
    const total = sections.length;
    const current = Math.max(1, Math.min(sectionIdx + 1, total));
    const percent = Math.round((current / total) * 100);
    window.currentProgress = percent;

    const progressWrap  = container.querySelector('.ld-progress[role="progressbar"]');
    const progressValue = container.querySelector('.progress-value.text-primary');
    if (progressWrap && window.animateProgressBar) {
      progressWrap.setAttribute("data-progress", String(percent));
      window.animateProgressBar(progressWrap);
    }
    if (progressValue) progressValue.textContent = percent + "%";
  }

  // Volgende sectie tonen
  function showNextSection(current) {
    const idx = sections.indexOf(current);
    if (idx > -1 && idx < sections.length - 1) {
      current.style.display = "none";
      sections[idx + 1].style.display = "block";
      updateProgressBar(idx + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (current.classList.contains("final-coreg")) {
      handleFinalCoreg(current);
    }
  }

  // Finale coreg-afhandeling (naar long form of einde)
  function handleFinalCoreg(current) {
    if (window.__coregFinalised) return;
    window.__coregFinalised = true;

    if (current) current.style.display = "none";

    let hasTmPositive = false;
    window.allCampaigns.forEach(camp => {
      if (camp.requiresLongForm) {
        if (camp.hasCoregFlow) {
          const step1 = sessionStorage.getItem(`coreg_answer_${camp.id}`);
          const dropdownCamp = window.allCampaigns.find(c => c.cid === camp.cid && Number(c.step) === 2);
          const step2 = dropdownCamp ? sessionStorage.getItem(`coreg_answer_${dropdownCamp.id}`) : null;
          if (step1 === "yes" && step2 && step2 !== "no") hasTmPositive = true;
        } else {
          const answer = sessionStorage.getItem(`coreg_answer_${camp.id}`);
          if (answer === "yes") hasTmPositive = true;
        }
      }
    });

    if (hasTmPositive) {
      const longFormBtn =
        document.getElementById("coreg-longform-btn") ||
        document.querySelector(".coreg-longform-btn.flow-next");
      if (longFormBtn) {
        console.log("[coreg] TM positief → klik longform knop");
        longFormBtn.click();
      } else {
        console.warn("[coreg] coreg-longform-btn niet gevonden – controleer ID/class in SwipePages.");
      }
    } else {
      const finishBtn =
        document.getElementById("coreg-finish-btn") ||
        document.querySelector(".final-coreg.flow-next");
      if (finishBtn) {
        console.log("[coreg] Geen TM positief → klik finish knop");
        finishBtn.click();
      } else {
        console.warn("[coreg] coreg-finish-btn niet gevonden – controleer ID/class in SwipePages.");
      }
    }
  }

  // ======================================
  // ✅ Listeners per sectie
  // ======================================
  sections.forEach(section => {

    // ✅ Fix 2: verbeterde dropdown listener
    const dropdown = section.querySelector(".coreg-dropdown");
    if (dropdown) {
      dropdown.addEventListener("change", () => {
        const opt = dropdown.options[dropdown.selectedIndex];
        if (!opt || !opt.value) return;

        const selCid = opt.getAttribute("data-cid") || dropdown.dataset.cid;
        const selSid = opt.getAttribute("data-sid") || dropdown.dataset.sid;

        const key = `coreg_answer_${dropdown.dataset.campaign}`;
        const prev = sessionStorage.getItem(key);
        const combined = prev && prev.toLowerCase() === "yes"
          ? `${prev} - ${opt.value}`
          : opt.value;

        sessionStorage.setItem(key, combined);

        const camp = window.allCampaigns.find(c => c.id == dropdown.dataset.campaign);
        const isTM = !!(camp && camp.requiresLongForm);

        sendLead(selCid, selSid, combined, isTM);
        showNextSection(section);
      });
    }

    // Skip-link
    const skipLink = section.querySelector(".skip-link");
    if (skipLink) {
      skipLink.addEventListener("click", e => {
        e.preventDefault();
        sessionStorage.setItem(`coreg_answer_${skipLink.dataset.campaign}`, "no");
        showNextSection(section);
      });
    }

    // Buttons
    section.querySelectorAll(".flow-next").forEach(btn => {
      btn.addEventListener("click", () => {
        const campId = btn.dataset.campaign;
        const cid    = btn.dataset.cid;
        const sid    = btn.dataset.sid;
        const answer = btn.dataset.answer;

        if (campId) {
          sessionStorage.setItem(`coreg_answer_${campId}`, answer);
          if (answer === "yes") {
            const camp = window.allCampaigns.find(c => c.id == campId);
            if (camp && camp.requiresLongForm) {
              sendLead(cid, sid, answer, true);
            } else {
              sendLead(cid, sid, answer, false);
            }
          }
        }

        if (btn.classList.contains("sponsor-next")) {
          const nextStep = section.nextElementSibling;
          section.style.display = "none";
          if (nextStep) nextStep.style.display = "block";
        } else if (btn.classList.contains("skip-next")) {
          section.style.display = "none";
          showNextSection(section.nextElementSibling || section);
        } else {
          showNextSection(section);
        }
      });
    });
  });

  window.sendAllTMLeads = sendAllTMLeads;
}

// ======================================
// ✅ Afbeeldingen herladen bij scroll (lazyload fix)
// ======================================
window.addEventListener("scroll", () => {
  const visibleSections = document.querySelectorAll(".coreg-section");
  visibleSections.forEach(section => {
    const rect = section.getBoundingClientRect();
    const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
    if (isVisible) {
      const imgs = section.querySelectorAll("img[data-src], img[src*='data:image']");
      imgs.forEach(img => {
        const newSrc = img.getAttribute("data-src") || img.src;
        if (newSrc && img.src !== newSrc) {
          img.src = newSrc;
          console.log("🖼️ Lazy image geladen:", newSrc);
        }
      });
    }
  });
});

window.addEventListener("DOMContentLoaded", initCoregFlow);
