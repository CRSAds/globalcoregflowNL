// =============================================================
// coregRenderer.js
// Renderer + flow logica met progressbar bovenin het witte kader
// -------------------------------------------------------------
// ✅ Toont coregvragen in exacte volgorde van Directus
// ✅ Ondersteunt multi-step campagnes (step 1, 2, 3, ...)
// ✅ Herstelt formdata uit DOM (short + long form)
// ✅ Stuurt leads naar Databowl (EM + TM)
// ✅ Lazyload-fix voor afbeeldingen
// =============================================================

// ---------------------------------------
// Globale configuratie
// ---------------------------------------
if (typeof window.API_COREG === "undefined") {
  window.API_COREG = "https://globalcoregflow-nl.vercel.app/api/coreg.js";
}
const API_COREG = window.API_COREG;

// ---------------------------------------
// Formulierdata actief bijhouden in sessionStorage
// ---------------------------------------
function refreshSessionFormData() {
  const shortForm = document.querySelector("#lead-form");
  const longForm = document.querySelector("#long-form");

  if (shortForm) {
    sessionStorage.setItem("gender", shortForm.querySelector("input[name='gender']:checked")?.value || sessionStorage.getItem("gender") || "");
    sessionStorage.setItem("firstname", shortForm.querySelector("#firstname")?.value || sessionStorage.getItem("firstname") || "");
    sessionStorage.setItem("lastname", shortForm.querySelector("#lastname")?.value || sessionStorage.getItem("lastname") || "");
    sessionStorage.setItem("email", shortForm.querySelector("#email")?.value || sessionStorage.getItem("email") || "");
    sessionStorage.setItem("dob_day", shortForm.querySelector("#dob-day")?.value || sessionStorage.getItem("dob_day") || "");
    sessionStorage.setItem("dob_month", shortForm.querySelector("#dob-month")?.value || sessionStorage.getItem("dob_month") || "");
    sessionStorage.setItem("dob_year", shortForm.querySelector("#dob-year")?.value || sessionStorage.getItem("dob_year") || "");
  }

  if (longForm) {
    sessionStorage.setItem("postcode", longForm.querySelector("#postcode")?.value || sessionStorage.getItem("postcode") || "");
    sessionStorage.setItem("straat", longForm.querySelector("#straat")?.value || sessionStorage.getItem("straat") || "");
    sessionStorage.setItem("huisnummer", longForm.querySelector("#huisnummer")?.value || sessionStorage.getItem("huisnummer") || "");
    sessionStorage.setItem("woonplaats", longForm.querySelector("#woonplaats")?.value || sessionStorage.getItem("woonplaats") || "");
    sessionStorage.setItem("telefoon", longForm.querySelector("#telefoon")?.value || sessionStorage.getItem("telefoon") || "");
  }
}

// ---------------------------------------
// Hulpfuncties
// ---------------------------------------
function getImageUrl(image) {
  if (!image) return "https://via.placeholder.com/600x200?text=Geen+afbeelding";
  return image.id
    ? `https://cms.core.909play.com/assets/${image.id}`
    : image.url || "https://via.placeholder.com/600x200?text=Geen+afbeelding";
}

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
    else console.warn(`⚠️ ${r.name} ontbreekt of niet actief.`);
  });
  console.groupEnd();
}
document.addEventListener("DOMContentLoaded", logCoregSystemCheck);

// ---------------------------------------
// Campagnes laden vanuit Directus
// ---------------------------------------
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

// ---------------------------------------
// Lead-verzending naar Databowl
// ---------------------------------------
async function sendLeadToDatabowl(payload) {
  try {
    const result = await window.fetchLead(payload);
    const leadId = result?.result?.data?.id || result?.lead_id || result?.id || "onbekend";
    console.log("%c✅ Lead verzonden naar Databowl", "color:green;font-weight:bold;", { cid: payload.cid, sid: payload.sid, leadId });
    return result;
  } catch (err) {
    console.error("❌ Fout bij versturen lead naar Databowl:", err);
    return null;
  }
}

// ---------------------------------------
// Progressbar
// ---------------------------------------
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

// ---------------------------------------
// Rendering logica per campagne
// ---------------------------------------
function renderMultistep(campaign, isFinal) {
  const steps = (window.allCampaigns || [])
    .filter(c => c.cid === campaign.cid)
    .sort((a, b) => Number(a.step) - Number(b.step));

  const html = steps.map((step, index) => {
    const visible = index === 0 ? "block" : "none";
    const answers = step.coreg_answers || [];

    if (step.ui_style === "dropdown") {
      return `
        <div class="coreg-section ${isFinal && index === steps.length - 1 ? "final-coreg" : ""}"
             id="campaign-${step.cid}-step${step.step}"
             style="display:${visible}">
          <img src="${getImageUrl(step.image)}" alt="${step.title}" class="coreg-image" />
          <h3 class="coreg-title">${step.title}</h3>
          <p class="coreg-description">${step.description || ""}</p>
          <select class="coreg-dropdown"
                  data-campaign="${step.id}"
                  data-cid="${step.cid}"
                  data-sid="${step.sid}">
            <option value="">Maak een keuze...</option>
            ${answers.map(opt => `
              <option value="${opt.answer_value}"
                      data-cid="${opt.has_own_campaign ? opt.cid : step.cid}"
                      data-sid="${opt.has_own_campaign ? opt.sid : step.sid}">
                ${opt.label}
              </option>`).join("")}
          </select>
          <a href="#" class="skip-link" data-answer="no" data-campaign="${step.id}">Geen interesse, sla over</a>
        </div>`;
    }

    return `
      <div class="coreg-section ${isFinal && index === steps.length - 1 ? "final-coreg" : ""}"
           id="campaign-${step.cid}-step${step.step}"
           style="display:${visible}">
        <img src="${getImageUrl(step.image)}" alt="${step.title}" class="coreg-image" />
        <h3 class="coreg-title">${step.title}</h3>
        <p class="coreg-description">${step.description || ""}</p>
        <div class="coreg-answers">
          ${answers.map(opt => `
            <button class="flow-next ${index < steps.length - 1 ? "sponsor-next" : ""}"
                    data-answer="${opt.answer_value}"
                    data-campaign="${step.id}"
                    data-cid="${opt.has_own_campaign ? opt.cid : step.cid}"
                    data-sid="${opt.has_own_campaign ? opt.sid : step.sid}">
              ${opt.label}
            </button>`).join("")}
          ${index < steps.length - 1 ? "" : `
            <button class="flow-next btn-skip"
                    data-answer="no"
                    data-campaign="${step.id}">
              Nee, geen interesse
            </button>`}
        </div>
      </div>`;
  }).join("");

  return html;
}

function renderCampaign(campaign, isFinal) {
  if (campaign.hasCoregFlow) return renderMultistep(campaign, isFinal);
  return renderMultistep(campaign, isFinal);
}

// ---------------------------------------
// Lead functies met logging
// ---------------------------------------
async function sendLead(cid, sid, answer, isTM = false) {
  try {
    refreshSessionFormData();
    if (answer) sessionStorage.setItem(`coreg_answer_${cid}_${sid}`, answer);

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

    await sendLeadToDatabowl(payload);
  } catch (err) {
    console.error("[coreg] Fout bij sendLead:", err);
  }
}

// ---------------------------------------
// Init flow
// ---------------------------------------
async function initCoregFlow() {
  const container = document.getElementById("coreg-container");
  if (!container) return;

  refreshSessionFormData(); // ✅ herstelt formdata uit short + long form
  
  const campaigns = await fetchCampaigns();
  window.allCampaigns = campaigns;

  document.dispatchEvent(new CustomEvent("coregReady", { detail: { campaigns } }));
  console.log("✅ coregReady event verstuurd naar initFlow-lite.js");

  container.innerHTML = `
    <div class="coreg-inner">
      ${renderProgressBar(0)}
      <div id="coreg-sections"></div>
    </div>`;

  const sectionsContainer = container.querySelector("#coreg-sections");

  // ✅ Unieke campagnes per CID
  const filteredCampaigns = campaigns.filter((camp, index, self) =>
    self.findIndex(c => c.cid === camp.cid) === index
  );

  filteredCampaigns.forEach((camp, i) => {
    const isFinal = i === filteredCampaigns.length - 1;
    sectionsContainer.innerHTML += renderCampaign(camp, isFinal);
  });

  const sections = Array.from(sectionsContainer.querySelectorAll(".coreg-section"));
  sections.forEach((s, i) => (s.style.display = i === 0 ? "block" : "none"));

  // ✅ Progressbar
  function updateProgressBar(sectionIdx) {
    const total = sections.length;
    const current = Math.max(1, Math.min(sectionIdx + 1, total));
    const percent = Math.round((current / total) * 100);
    window.currentProgress = percent;
    const bar = container.querySelector(".ld-progress[role='progressbar']");
    const value = container.querySelector(".progress-value.text-primary");
    if (bar) bar.setAttribute("data-progress", String(percent));
    if (value) value.textContent = percent + "%";
    if (window.animateProgressBar) window.animateProgressBar(bar);
  }

  // ✅ Volgende sectie/stap tonen
  function showNextSection(current) {
    const idx = sections.indexOf(current);
    if (idx > -1 && idx < sections.length - 1) {
      current.style.display = "none";
      sections[idx + 1].style.display = "block";
      updateProgressBar(idx + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  // ✅ Eventhandlers
  sections.forEach(section => {
    section.querySelectorAll(".flow-next").forEach(btn => {
      btn.addEventListener("click", () => {
        const cid = btn.dataset.cid;
        const sid = btn.dataset.sid;
        const answer = btn.dataset.answer || "yes";
        const campId = btn.dataset.campaign;

        if (campId) sessionStorage.setItem(`coreg_answer_${campId}`, answer);

        const isTM = window.allCampaigns.find(c => c.cid === cid)?.requiresLongForm || false;
        sendLead(cid, sid, answer, isTM);

        // ✅ Sponsoren met meerdere stappen
        if (btn.classList.contains("sponsor-next")) {
          const currentStepMatch = section.id.match(/step(\d+)/);
          const nextStepNum = currentStepMatch ? parseInt(currentStepMatch[1]) + 1 : null;
          const nextStepSection = document.querySelector(`#campaign-${cid}-step${nextStepNum}`);
          section.style.display = "none";
          if (nextStepSection) {
            nextStepSection.style.display = "block";
            return;
          }
        }

        showNextSection(section);
      });
    });
  });
}

// ---------------------------------------
// Lazyload fix
// ---------------------------------------
window.addEventListener("scroll", () => {
  const sections = document.querySelectorAll(".coreg-section");
  sections.forEach(section => {
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
