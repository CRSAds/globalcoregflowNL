// coregRenderer.js
// ==============================================
// Renderer + flow logica met progressbar bovenin
// ==============================================

// ✅ API endpoint
if (typeof window.API_COREG === "undefined") {
  window.API_COREG = "https://globalcoregflow-nl.vercel.app/api/coreg.js";
}
const API_COREG = window.API_COREG;

// =======================================
// Helpers
// =======================================
function getImageUrl(image) {
  if (!image) return "https://via.placeholder.com/600x200?text=Geen+afbeelding";
  return image.id
    ? `https://cms.core.909play.com/assets/${image.id}`
    : image.url || "https://via.placeholder.com/600x200?text=Geen+afbeelding";
}

function refreshSessionFormData() {
  const shortForm = document.querySelector("#lead-form");
  const longForm = document.querySelector("#long-form");

  const shortFields = [
    "gender", "firstname", "lastname", "email",
    "dob_day", "dob_month", "dob_year"
  ];
  const longFields = [
    "postcode", "straat", "huisnummer", "woonplaats", "telefoon"
  ];

  shortFields.forEach(f => {
    const el = shortForm?.querySelector(`[name='${f}'], #${f}`);
    if (el) sessionStorage.setItem(f, el.value || sessionStorage.getItem(f) || "");
  });
  longFields.forEach(f => {
    const el = longForm?.querySelector(`[name='${f}'], #${f}`);
    if (el) sessionStorage.setItem(f, el.value || sessionStorage.getItem(f) || "");
  });
}

// =======================================
// Fetch campagnes
// =======================================
async function fetchCampaigns() {
  try {
    const res = await fetch(API_COREG);
    if (!res.ok) throw new Error(`Kon campagnes niet laden (status ${res.status})`);
    const json = await res.json();
    console.log("📦 Campagnes uit Directus:", json.data?.length || 0);
    return json.data || [];
  } catch (err) {
    console.error("❌ Fout bij laden campagnes:", err);
    return [];
  }
}

// =======================================
// Lead functies
// =======================================
async function sendLeadToDatabowl(payload) {
  try {
    const result = await window.fetchLead(payload);
    const leadId =
      result?.result?.data?.id || result?.lead_id || result?.id || "onbekend";
    console.log("✅ Lead verzonden:", {
      cid: payload.cid,
      sid: payload.sid,
      leadId,
      result,
    });
    return result;
  } catch (err) {
    console.error("❌ Fout bij versturen lead:", err);
    return null;
  }
}

async function sendLead(cid, sid, answer, isTM = false) {
  try {
    refreshSessionFormData();
    const payload = window.buildPayload({ cid, sid });
    payload.coreg_answer = answer || "";
    console.log("[coreg] sendLead()", { cid, sid, answer, isTM, payload });

    if (isTM) {
      let pending = JSON.parse(sessionStorage.getItem("pendingTMLeads") || "[]");
      pending = pending.filter(l => l.cid !== cid || l.sid !== sid);
      pending.push(payload);
      sessionStorage.setItem("pendingTMLeads", JSON.stringify(pending));
      console.log("[coreg] TM lead opgeslagen (pendingTMLeads):", pending);
      return;
    }

    const result = await sendLeadToDatabowl(payload);
    console.log("[coreg] EM lead direct verstuurd:", result);
  } catch (err) {
    console.error("[coreg] Fout bij sendLead:", err);
  }
}

async function sendAllTMLeads() {
  const leads = JSON.parse(sessionStorage.getItem("pendingTMLeads") || "[]");
  for (const lead of leads) {
    try {
      await window.fetchLead(lead);
      console.log("📤 TM lead verstuurd:", lead);
    } catch (err) {
      console.error("❌ TM lead error:", err);
    }
  }
  sessionStorage.removeItem("pendingTMLeads");
}

// =======================================
// Render helpers
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

// Basisvraag (buttons)
function renderButtonCampaign(campaign, isFinal) {
  const answers = campaign.coreg_answers || [];
  return `
  <div class="coreg-section ${isFinal ? "final-coreg" : ""}" id="campaign-${campaign.id}">
    <img src="${getImageUrl(campaign.image)}" alt="${campaign.title}" class="coreg-image" />
    <h3 class="coreg-title">${campaign.title}</h3>
    <p class="coreg-description">${campaign.description || ""}</p>
    <div class="coreg-answers">
      ${answers
        .map(ans => `
        <button class="flow-next btn-answer"
          data-answer="${ans.answer_value || 'yes'}"
          data-campaign="${campaign.id}"
          data-cid="${ans.has_own_campaign ? ans.cid : campaign.cid}"
          data-sid="${ans.has_own_campaign ? ans.sid : campaign.sid}">
          ${ans.label}
        </button>`).join("")}
      <button class="flow-next btn-skip"
        data-answer="no"
        data-campaign="${campaign.id}">
        Nee, geen interesse
      </button>
    </div>
  </div>`;
}

// Dropdownvraag
function renderDropdownCampaign(campaign, isFinal) {
  const options = campaign.coreg_answers || [];
  return `
  <div class="coreg-section ${isFinal ? "final-coreg" : ""}" id="campaign-${campaign.id}">
    <img src="${getImageUrl(campaign.image)}" alt="${campaign.title}" class="coreg-image" />
    <h3 class="coreg-title">${campaign.title}</h3>
    <p class="coreg-description">${campaign.description || ""}</p>
    <select class="coreg-dropdown"
      data-campaign="${campaign.id}"
      data-cid="${campaign.cid || ''}"
      data-sid="${campaign.sid || ''}">
      <option value="">Maak een keuze...</option>
      ${options.map(opt => `
        <option value="${opt.answer_value}"
          data-cid="${opt.has_own_campaign ? opt.cid : campaign.cid}"
          data-sid="${opt.has_own_campaign ? opt.sid : campaign.sid}">
          ${opt.label}
        </option>`).join("")}
    </select>
    <a href="#" class="skip-link" data-answer="no" data-campaign="${campaign.id}">Geen interesse, sla over</a>
  </div>`;
}

// Multi-step (zoals Trefzeker)
function renderMultistepCampaign(campaignGroup, isFinal) {
  return campaignGroup.map((step, i) => {
    const visible = i === 0 ? "block" : "none";
    const answers = step.coreg_answers || [];
    const nextStep = campaignGroup[i + 1];
    const nextClass = nextStep ? `sponsor-next next-step-${nextStep.id}` : "";

    if (step.ui_style === "dropdown") {
      return `
      <div class="coreg-section ${isFinal && i === campaignGroup.length - 1 ? "final-coreg" : ""}"
        id="campaign-${step.id}" style="display:${visible}">
        <img src="${getImageUrl(step.image)}" alt="${step.title}" class="coreg-image" />
        <h3 class="coreg-title">${step.title}</h3>
        <select class="coreg-dropdown"
          data-campaign="${step.id}"
          data-cid="${step.cid || ''}"
          data-sid="${step.sid || ''}">
          <option value="">Maak een keuze...</option>
          ${answers.map(opt => `
            <option value="${opt.answer_value}"
              data-cid="${opt.has_own_campaign ? opt.cid : step.cid}"
              data-sid="${opt.has_own_campaign ? opt.sid : step.sid}">
              ${opt.label}
            </option>`).join("")}
        </select>
        <a href="#" class="skip-link" data-answer="no" data-campaign="${step.id}">Sla over</a>
      </div>`;
    }

    return `
    <div class="coreg-section ${isFinal && i === campaignGroup.length - 1 ? "final-coreg" : ""}"
      id="campaign-${step.id}" style="display:${visible}">
      <img src="${getImageUrl(step.image)}" alt="${step.title}" class="coreg-image" />
      <h3 class="coreg-title">${step.title}</h3>
      <p class="coreg-description">${step.description || ""}</p>
      <div class="coreg-answers">
        ${answers.map(opt => `
          <button class="flow-next ${nextClass}"
            data-answer="${opt.answer_value}"
            data-campaign="${step.id}"
            data-cid="${opt.has_own_campaign ? opt.cid : step.cid}"
            data-sid="${opt.has_own_campaign ? opt.sid : step.sid}">
            ${opt.label}
          </button>`).join("")}
      </div>
    </div>`;
  }).join("");
}

// =======================================
// Init flow
// =======================================
async function initCoregFlow() {
  const container = document.getElementById("coreg-container");
  if (!container) return;

  const campaigns = await fetchCampaigns();
  window.allCampaigns = campaigns;

  // 🔔 Event voor initFlow-lite
  document.dispatchEvent(new CustomEvent("coregReady", { detail: { campaigns } }));

  container.innerHTML = `
    <div class="coreg-inner">
      ${renderProgressBar(0)}
      <div id="coreg-sections"></div>
    </div>`;
  const sectionsContainer = container.querySelector("#coreg-sections");

  // Groepeer multistep-campagnes
  const grouped = [];
  const groupedIds = new Set();
  campaigns.forEach(camp => {
    if (camp.hasCoregFlow) {
      if (!groupedIds.has(camp.cid)) {
        const group = campaigns.filter(c => c.cid === camp.cid).sort((a,b)=>a.step-b.step);
        grouped.push(group);
        group.forEach(c => groupedIds.add(c.cid));
      }
    } else if (!groupedIds.has(camp.id)) {
      grouped.push([camp]);
    }
  });

  // Render campagnes in juiste volgorde
  grouped.forEach((group, i) => {
    const isFinal = i === grouped.length - 1;
    const first = group[0];
    if (group.length > 1 && first.hasCoregFlow) {
      sectionsContainer.innerHTML += renderMultistepCampaign(group, isFinal);
    } else if (first.ui_style === "dropdown") {
      sectionsContainer.innerHTML += renderDropdownCampaign(first, isFinal);
    } else {
      sectionsContainer.innerHTML += renderButtonCampaign(first, isFinal);
    }
  });

  // Setup secties
  const sections = Array.from(sectionsContainer.querySelectorAll(".coreg-section"));
  sections.forEach((s, i) => (s.style.display = i === 0 ? "block" : "none"));

  // Progressbar update
  function updateProgressBar(index) {
    const total = sections.length;
    const percent = Math.round(((index + 1) / total) * 100);
    const progress = container.querySelector(".progress-bar");
    const value = container.querySelector(".progress-value");
    if (progress) progress.style.width = percent + "%";
    if (value) value.textContent = percent + "%";
  }

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

  function handleFinalCoreg(current) {
    if (window.__coregFinalised) return;
    window.__coregFinalised = true;
    current?.style && (current.style.display = "none");

    let hasTmPositive = false;
    window.allCampaigns.forEach(camp => {
      if (camp.requiresLongForm) {
        const val = sessionStorage.getItem(`coreg_answer_${camp.id}`);
        if (val && val !== "no") hasTmPositive = true;
      }
    });

    const longFormBtn = document.getElementById("coreg-longform-btn");
    const finishBtn = document.getElementById("coreg-finish-btn");
    if (hasTmPositive && longFormBtn) longFormBtn.click();
    else if (finishBtn) finishBtn.click();
  }

  // Listeners
  sections.forEach(section => {
    const dropdown = section.querySelector(".coreg-dropdown");
    if (dropdown) {
      dropdown.addEventListener("change", () => {
        const opt = dropdown.options[dropdown.selectedIndex];
        if (!opt.value) return;
        const cid = opt.dataset.cid || dropdown.dataset.cid;
        const sid = opt.dataset.sid || dropdown.dataset.sid;
        const answer = opt.value;
        sendLead(cid, sid, answer, false);
        showNextSection(section);
      });
    }

    const skip = section.querySelector(".skip-link");
    if (skip) {
      skip.addEventListener("click", e => {
        e.preventDefault();
        showNextSection(section);
      });
    }

    section.querySelectorAll(".flow-next").forEach(btn => {
      btn.addEventListener("click", () => {
        const cid = btn.dataset.cid;
        const sid = btn.dataset.sid;
        const answer = btn.dataset.answer;
        const campId = btn.dataset.campaign;
        const isTM = !!(window.allCampaigns.find(c => c.id == campId)?.requiresLongForm);
        sendLead(cid, sid, answer, isTM);

        if (btn.classList.contains("sponsor-next")) {
          const nextId = btn.className.match(/next-step-(\d+)/);
          if (nextId) {
            const next = document.getElementById(`campaign-${nextId[1]}`);
            if (next) {
              section.style.display = "none";
              next.style.display = "block";
              return;
            }
          }
        }
        showNextSection(section);
      });
    });
  });

  window.sendAllTMLeads = sendAllTMLeads;
}

window.addEventListener("DOMContentLoaded", initCoregFlow);
