// coregRenderer.js
// Renderer + flow logica met correcte afbeeldingen, Databowl payload en multistep fix

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

// ✅ Template progress bar style 1
function renderProgressBar(progress = 0) {
  return `
    <div class="ld-progress-wrap mb-25">
      <div class="ld-progress-info">
        <span class="progress-label">Je bent er bijna</span>
        <span class="progress-value text-primary">${progress}%</span>
      </div>
      <div class="ld-progress lh-6" role="progressbar" data-progress="${progress}">
        <div class="progress-bar"></div>
      </div>
    </div>`;
}

function renderSingle(campaign, isFinal) {
  return `
    <div class="coreg-section ${isFinal ? "final-coreg" : ""}" id="campaign-${campaign.id}">
      <div class="coreg-inner">
        ${renderProgressBar(0)}
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
          <button class="flow-next btn-skip" data-answer="no" data-campaign="${campaign.id}">Nee, geen interesse</button>
        </div>
      </div>
    </div>`;
}

function renderDropdown(campaign, isFinal) {
  return `
    <div class="coreg-section ${isFinal ? "final-coreg" : ""}" id="campaign-${campaign.id}">
      <div class="coreg-inner">
        ${renderProgressBar(0)}
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

function renderMultistep(campaign, isFinal) {
  let dropdownCampaign = campaign;
  if (window.allCampaigns && Array.isArray(window.allCampaigns)) {
    const found = window.allCampaigns.find(c => c.cid === campaign.cid && c.type === 'dropdown');
    if (found) dropdownCampaign = found;
  }
  const dropdownOptions = dropdownCampaign.coreg_dropdown_options || [];

  return `
    <div class="coreg-section" id="campaign-${campaign.id}-step1">
      <div class="coreg-inner">
        ${renderProgressBar(0)}
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
        ${renderProgressBar(0)}
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

function renderCampaign(campaign, isFinal) {
  if (campaign.hasCoregFlow) return renderMultistep(campaign, isFinal);
  if (campaign.type === "dropdown") return renderDropdown(campaign, isFinal);
  return renderSingle(campaign, isFinal);
}

// … (rest van de functies zoals sendLead, initCoregFlow blijven identiek)
