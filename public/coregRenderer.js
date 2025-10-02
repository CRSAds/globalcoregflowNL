// coregRenderer.js
// Renderer + flow logica met progressbar bovenin het witte kader
// Inclusief fix: bij TM positief wordt coreg afgesloten via een verborgen flow-next button

const API_COREG = "https://globalcoregflow-nl.vercel.app/api/coreg.js";
const API_LEAD = "https://globalcoregflow-nl.vercel.app/api/lead.js";

function getImageUrl(image) {
  return image?.id
    ? `https://cms.core.909play.com/assets/${image.id}`
    : "https://via.placeholder.com/600x200?text=Geen+afbeelding";
}

function getShortFormData() {
  return {
    firstname: sessionStorage.getItem("firstname") || "",
    lastname: sessionStorage.getItem("lastname") || "",
    email: sessionStorage.getItem("email") || "",
    dob: sessionStorage.getItem("dob") || "",
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

// ✅ Progressbar
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

// ✅ Campagne renders
function renderSingle(campaign, isFinal) {
  return `
    <div class="coreg-section ${isFinal ? "final-coreg" : ""}" id="campaign-${campaign.id}">
      <img src="${getImageUrl(campaign.image)}" alt="${campaign.title}" class="coreg-image" />
      <h3 class="coreg-title">${campaign.title}</h3>
      <p class="coreg-description">${campaign.description}</p>
      <div class="coreg-answers">
        ${campaign.coreg_answers
          .map(ans => `
            <button class="flow-next btn-answer" data-answer="yes" data-campaign="${campaign.id}" data-cid="${campaign.cid}" data-sid="${campaign.sid}">
              Ja, ${ans.label}
            </button>`
          ).join("")}
        <button class="flow-next btn-skip" data-answer="no" data-campaign="${campaign.id}">Nee, geen interesse</button>
      </div>
      <!-- Verborgen knop om naar long form te gaan -->
      <button id="coreg-longform-btn" class="flow-next" style="display:none"></button>
    </div>`;
}

function renderDropdown(campaign, isFinal) {
  return `
    <div class="coreg-section ${isFinal ? "final-coreg" : ""}" id="campaign-${campaign.id}">
      <img src="${getImageUrl(campaign.image)}" alt="${campaign.title}" class="coreg-image" />
      <h3 class="coreg-title">${campaign.title}</h3>
      <p class="coreg-description">${campaign.description}</p>
      <select class="coreg-dropdown" data-campaign="${campaign.id}" data-cid="${campaign.cid}" data-sid="${campaign.sid}">
        <option value="">Maak een keuze...</option>
        ${campaign.coreg_dropdown_options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join("")}
      </select>
      <a href="#" class="skip-link" data-answer="no" data-campaign="${campaign.id}">Geen interesse, sla over</a>
      <!-- Verborgen knop om naar long form te gaan -->
      <button id="coreg-longform-btn" class="flow-next" style="display:none"></button>
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
      <img src="${getImageUrl(campaign.image)}" alt="${campaign.title}" class="coreg-image" />
      <h3 class="coreg-title">${campaign.title}</h3>
      <p class="coreg-description">${campaign.description}</p>
      <div class="coreg-answers">
        <button class="flow-next sponsor-next next-step-campaign-${campaign.id}-step2"
                data-answer="yes" data-campaign="${campaign.id}" data-cid="${campaign.cid}" data-sid="${campaign.sid}">
          Ja, graag
        </button>
        <button class="flow-next skip-next btn-skip" data-answer="no" data-campaign="${campaign.id}">
          Nee, geen interesse
        </button>
      </div>
      <!-- Verborgen knop om naar long form te gaan -->
      <button id="coreg-longform-btn" class="flow-next" style="display:none"></button>
    </div>

    <div class="coreg-section ${isFinal ? "final-coreg" : ""}" id="campaign-${dropdownCampaign.id}-step2" style="display:none">
      <img src="${getImageUrl(dropdownCampaign.image)}" alt="${dropdownCampaign.title}" class="coreg-image" />
      <h3 class="coreg-title">Wie is je huidige energieleverancier?</h3>
      <select class="coreg-dropdown" data-campaign="${dropdownCampaign.id}" data-cid="${dropdownCampaign.cid}" data-sid="${dropdownCampaign.sid}">
        <option value="">Kies je huidige leverancier...</option>
        ${dropdownOptions.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join("")}
      </select>
      <a href="#" class="skip-link" data-answer="no" data-campaign="${dropdownCampaign.id}">Toch geen interesse</a>
      <!-- Verborgen knop om naar long form te gaan -->
      <button id="coreg-longform-btn" class="flow-next" style="display:none"></button>
    </div>`;
}

function renderCampaign(campaign, isFinal) {
  if (campaign.hasCoregFlow) return renderMultistep(campaign, isFinal);
  if (campaign.type === "dropdown") return renderDropdown(campaign, isFinal);
  return renderSingle(campaign, isFinal);
}

// === Lead functies ===
async function sendLead(cid, sid, answer, isTM = false, storeOnly = false) {
  try {
    const payload = { cid, sid, answer, ...getShortFormData() };
    if (isTM || storeOnly) {
      let tmLeads = JSON.parse(sessionStorage.getItem('pendingTMLeads') || '[]');
      tmLeads = tmLeads.filter(l => l.cid !== cid || l.sid !== sid);
      tmLeads.push(payload);
      sessionStorage.setItem('pendingTMLeads', JSON.stringify(tmLeads));
      return;
    }
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
    await fetch(API_LEAD, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead),
    });
  }
  sessionStorage.removeItem('pendingTMLeads');
}

// === Init flow ===
async function initCoregFlow() {
  const container = document.getElementById("coreg-container");
  if (!container) return;

  const campaigns = await fetchCampaigns();
  window.allCampaigns = campaigns;

  // ✅ Eén wit kader met progressbar bovenin
  container.innerHTML = `
    <div class="coreg-inner">
      ${renderProgressBar(0)}
      <div id="coreg-sections"></div>
    </div>
  `;

  const sectionsContainer = container.querySelector("#coreg-sections");

  const filteredCampaigns = campaigns.filter(c => {
    if (c.type === "dropdown" && campaigns.find(p => p.hasCoregFlow && p.cid === c.cid)) {
      return false;
    }
    return true;
  });
  filteredCampaigns.forEach((camp, i) => {
    const isFinal = i === filteredCampaigns.length - 1;
    sectionsContainer.innerHTML += renderCampaign(camp, isFinal);
  });

  const sections = Array.from(sectionsContainer.querySelectorAll(".coreg-section"));
  sections.forEach((s, i) => (s.style.display = i === 0 ? "block" : "none"));

  function updateProgressBar(sectionIdx) {
    const total = sections.length;
    const current = Math.max(1, Math.min(sectionIdx + 1, total));
    const percent = Math.round((current / total) * 100);
    window.currentProgress = percent;

    const progressWrap = container.querySelector('.ld-progress[role="progressbar"]');
    const progressValue = container.querySelector('.progress-value.text-primary');
    if (progressWrap && window.animateProgressBar) {
      progressWrap.setAttribute('data-progress', percent);
      window.animateProgressBar(progressWrap);
    }
    if (progressValue) progressValue.textContent = percent + '%';
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
    if (current) current.style.display = "none";

    let hasTmPositive = false;
    window.allCampaigns.forEach(camp => {
      if (camp.requiresLongForm) {
        if (camp.hasCoregFlow) {
          const step1 = sessionStorage.getItem(`coreg_answer_${camp.id}`);
          const dropdownCamp = window.allCampaigns.find(c => c.cid === camp.cid && c.type === 'dropdown');
          const step2 = dropdownCamp ? sessionStorage.getItem(`coreg_answer_${dropdownCamp.id}`) : null;
          if (step1 === "yes" && step2 && step2 !== "no") hasTmPositive = true;
        } else {
          const answer = sessionStorage.getItem(`coreg_answer_${camp.id}`);
          if (answer === "yes") hasTmPositive = true;
        }
      }
    });

    if (hasTmPositive) {
      // ✅ Laat Swipepages zelf naar long form springen via verborgen button
      const longFormBtn = document.getElementById("coreg-longform-btn");
      if (longFormBtn) longFormBtn.click();
    } else {
      // ✅ Geen long form → trigger de standaard finish
      const finishBtn = document.getElementById("coreg-finish-btn");
      if (finishBtn) finishBtn.click();
    }
  }

  // Event listeners
  sections.forEach(section => {
    const dropdown = section.querySelector(".coreg-dropdown");
    if (dropdown) {
      dropdown.addEventListener("change", () => {
        if (dropdown.value !== "") {
          sessionStorage.setItem(`coreg_answer_${dropdown.dataset.campaign}`, "yes");
          const camp = window.allCampaigns.find(c => c.id == dropdown.dataset.campaign);
          if (camp && camp.requiresLongForm) {
            sendLead(dropdown.dataset.cid, dropdown.dataset.sid, dropdown.value, true);
          } else {
            sendLead(dropdown.dataset.cid, dropdown.dataset.sid, dropdown.value, false);
          }
          showNextSection(section);
        }
      });
    }

    const skipLink = section.querySelector(".skip-link");
    if (skipLink) {
      skipLink.addEventListener("click", e => {
        e.preventDefault();
        sessionStorage.setItem(`coreg_answer_${skipLink.dataset.campaign}`, "no");
        showNextSection(section);
      });
    }

    section.querySelectorAll(".flow-next").forEach(btn => {
      btn.addEventListener("click", () => {
        const campId = btn.dataset.campaign;
        const cid = btn.dataset.cid;
        const sid = btn.dataset.sid;
        const answer = btn.dataset.answer;
        sessionStorage.setItem(`coreg_answer_${campId}`, answer);
        if (answer === "yes") {
          const camp = window.allCampaigns.find(c => c.id == campId);
          if (camp && camp.requiresLongForm) {
            sendLead(cid, sid, answer, true);
          } else {
            sendLead(cid, sid, answer, false);
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

window.addEventListener("DOMContentLoaded", initCoregFlow);
