// coregRenderer.js
// Renderer + flow logica met correcte afbeeldingen, Databowl payload en multistep fix + debug

const API_COREG = "https://globalcoregflow-nl.vercel.app/api/coreg.js";
const API_LEAD = "https://globalcoregflow-nl.vercel.app/api/lead.js";

// ✅ Directus afbeelding URL
function getImageUrl(image) {
  return image?.id
    ? `https://cms.core.909play.com/assets/${image.id}`
    : "https://via.placeholder.com/600x200?text=Geen+afbeelding";
}

// ✅ Short form data ophalen uit sessionStorage
function getShortFormData() {
  return {
    firstname: sessionStorage.getItem("firstname") || "",
    lastname: sessionStorage.getItem("lastname") || "",
    email: sessionStorage.getItem("email") || "",
    dob: sessionStorage.getItem("dob") || "", // yyyy-mm-dd
    postcode: sessionStorage.getItem("postcode") || "",
    phone1: sessionStorage.getItem("phone1") || ""
  };
}

async function fetchCampaigns() {
  const res = await fetch(API_COREG);
  if (!res.ok) throw new Error("Kon campagnes niet laden");
  const json = await res.json();
  return json.data;
}

// ---------- Renderers ----------
function renderSingle(campaign, isFinal, idx, total, progressIdx) {
  return `
    <div class="coreg-section ${isFinal ? "final-coreg" : ""}" id="campaign-${campaign.id}">
      <div class="coreg-inner">
        ${renderProgressBar(progressIdx, total)}
        <img src="${getImageUrl(campaign.image)}" alt="${campaign.title}" class="coreg-image" />
        <h3 class="coreg-title">${campaign.title}</h3>
        <p class="coreg-description">${campaign.description}</p>
        <div class="coreg-answers">
          ${campaign.coreg_answers
            .map(
              ans => `
              <button class="flow-next btn-answer" data-answer="yes" data-campaign="${campaign.id}" data-cid="${campaign.cid}" data-sid="${campaign.sid}">
                Ja, ${ans.label}
              </button>`
            )
            .join("")}
          <button class="flow-next btn-skip" data-answer="no" data-campaign="${campaign.id}">Sla over, geen interesse</button>
        </div>
      </div>
    </div>`;
}

function renderDropdown(campaign, isFinal, idx, total, progressIdx) {
  return `
    <div class="coreg-section ${isFinal ? "final-coreg" : ""}" id="campaign-${campaign.id}">
      <div class="coreg-inner">
        ${renderProgressBar(progressIdx, total)}
        <img src="${getImageUrl(campaign.image)}" alt="${campaign.title}" class="coreg-image" />
        <h3 class="coreg-title">${campaign.title}</h3>
        <p class="coreg-description">${campaign.description}</p>
        <select class="coreg-dropdown" data-campaign="${campaign.id}" data-cid="${campaign.cid}" data-sid="${campaign.sid}">
          <option value="">Maak een keuze...</option>
          ${campaign.coreg_dropdown_options
            .map(opt => `<option value="${opt.value}">${opt.label}</option>`)
            .join("")}
        </select>
        <a href="#" class="skip-link" data-answer="no" data-campaign="${campaign.id}">Geen interesse, sla over</a>
      </div>
    </div>`;
}

function renderMultistep(campaign, isFinal, idx, total, progressIdx) {
  let dropdownCampaign = campaign;
  if (window.allCampaigns && Array.isArray(window.allCampaigns)) {
    const found = window.allCampaigns.find(c => c.cid === campaign.cid && c.type === 'dropdown');
    if (found) dropdownCampaign = found;
  }
  const dropdownOptions = dropdownCampaign.coreg_dropdown_options || [];
  return `
    <div class="coreg-section" id="campaign-${campaign.id}-step1">
      <div class="coreg-inner">
        ${renderProgressBar(progressIdx, total)}
        <img src="${getImageUrl(campaign.image)}" alt="${campaign.title}" class="coreg-image" />
        <h3 class="coreg-title">${campaign.title}</h3>
        <p class="coreg-description">${campaign.description}</p>
        <button class="flow-next sponsor-next next-step-campaign-${campaign.id}-step2"
                data-answer="yes" data-campaign="${campaign.id}" data-cid="${campaign.cid}" data-sid="${campaign.sid}">
          Ja, graag
        </button>
        <button class="flow-next skip-next" data-answer="no" data-campaign="${campaign.id}">Nee, geen interesse</button>
      </div>
    </div>
    <div class="coreg-section ${isFinal ? "final-coreg" : ""}" id="campaign-${dropdownCampaign.id}-step2" style="display:none">
      <div class="coreg-inner">
        ${renderProgressBar(progressIdx, total)}
        <img src="${getImageUrl(dropdownCampaign.image)}" alt="${dropdownCampaign.title}" class="coreg-image" />
        <h3 class="coreg-title">Wie is je huidige energieleverancier?</h3>
        <select class="coreg-dropdown" data-campaign="${dropdownCampaign.id}" data-cid="${dropdownCampaign.cid}" data-sid="${dropdownCampaign.sid}">
          <option value="">Kies je huidige leverancier...</option>
          ${dropdownOptions
            .map(opt => `<option value="${opt.value}">${opt.label}</option>`)
            .join("")}
        </select>
        <a href="#" class="skip-link" data-answer="no" data-campaign="${dropdownCampaign.id}">Toch geen interesse</a>
      </div>
    </div>`;
}

function renderCampaign(campaign, isFinal, idx, total, progressIdx) {
  if (campaign.hasCoregFlow) return renderMultistep(campaign, isFinal, idx, total, progressIdx);
  if (campaign.type === "dropdown") return renderDropdown(campaign, isFinal, idx, total, progressIdx);
  return renderSingle(campaign, isFinal, idx, total, progressIdx);
}

// ---------- Lead logic ----------
async function sendLead(cid, sid, answer, isTM = false, storeOnly = false) {
  try {
    const payload = {
      cid,
      sid,
      answer,
      ...getShortFormData()
    };

    if (isTM || storeOnly) {
      let tmLeads = JSON.parse(sessionStorage.getItem('pendingTMLeads') || '[]');
      tmLeads = tmLeads.filter(l => l.cid !== cid || l.sid !== sid);
      tmLeads.push(payload);
      sessionStorage.setItem('pendingTMLeads', JSON.stringify(tmLeads));
      console.log('[TM] Lead opgeslagen voor later versturen:', payload);
      return;
    }

    console.log("[EM] Verstuur lead naar Databowl (via /api/lead):", payload);
    await fetch(API_LEAD, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("Lead versturen mislukt:", err);
  }
}

async function sendAllTMLeads() {
  const tmLeads = JSON.parse(sessionStorage.getItem('pendingTMLeads') || '[]');
  for (const lead of tmLeads) {
    console.log('[TM] Verstuur lead na long form:', lead);
    await fetch(API_LEAD, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead),
    });
  }
  sessionStorage.removeItem('pendingTMLeads');
}

// ---------- Progress Bar ----------
function renderProgressBar(currentIdx, total) {
  const root = document.getElementById('progress-bar-root');
  if (!root) return '';
  let stepsHtml = '';
  for (let i = 0; i < total; i++) {
    let cls = 'progress-step';
    if (i < currentIdx) cls += ' completed';
    if (i === currentIdx) cls += ' active';
    if (i === total - 1) cls += ' trophy';
    stepsHtml += `<div class="${cls}">${i === total-1 ? '🏆' : i+1}${i === currentIdx ? '<span class=confetti>✨</span>' : ''}</div>`;
  }
  root.innerHTML = `
    <div class="progress-bar-container">
      <div class="progress-bar-track">
        <div class="progress-bar-fill" style="width:${(currentIdx/(total-1))*100}%;"></div>
        <div class="progress-bar-steps">${stepsHtml}</div>
      </div>
    </div>`;
  return '';
}

// ---------- Init ----------
async function initCoregFlow() {
  const container = document.getElementById("coreg-container");
  if (!container) return;

  const campaigns = await fetchCampaigns();
  window.allCampaigns = campaigns;
  console.log("Campagne response:", campaigns);

  const filteredCampaigns = campaigns.filter(c => {
    if (c.type === "dropdown" && campaigns.find(p => p.hasCoregFlow && p.cid === c.cid)) {
      return false;
    }
    return true;
  });

  filteredCampaigns.forEach((camp, i) => {
    const isFinal = i === filteredCampaigns.length - 1;
    container.innerHTML += renderCampaign(camp, isFinal, i, filteredCampaigns.length, i);
  });

  // rest van je bestaande initCoregFlow blijft hetzelfde...
  // (events, handleFinalCoreg, enz.)
}

window.addEventListener("DOMContentLoaded", initCoregFlow);