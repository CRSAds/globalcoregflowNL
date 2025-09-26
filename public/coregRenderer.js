// coregRenderer.js
// Renderer + flow logica

const API_COREG = "https://globalcoregflow-nl.vercel.app/api/coreg.js";
const API_LEAD  = "https://globalcoregflow-nl.vercel.app/api/lead.js";

async function fetchCampaigns() {
  const res = await fetch(API_COREG);
  if (!res.ok) throw new Error("Kon campagnes niet laden");
  const json = await res.json();
  return json.data;
}

function renderSingle(campaign, isFinal) {
  return `
    <div class="coreg-section ${isFinal ? "final-coreg" : ""}" id="campaign-${campaign.id}">
      <img src="https://cms.core.909play.com/assets/${campaign.image.id}" alt="${campaign.title}" class="coreg-image" />
      <h3 class="coreg-title">${campaign.title}</h3>
      <p class="coreg-description">${campaign.description}</p>
      <div class="coreg-answers">
        ${campaign.coreg_answers
          .map(ans => `
            <button class="flow-next btn-answer" data-answer="yes" data-campaign="${campaign.id}" data-cid="${campaign.cid}" data-sid="${campaign.sid}">
              Ja, ${ans.label}
            </button>`).join("")}
        <button class="flow-next btn-skip" data-answer="no" data-campaign="${campaign.id}">Sla over, geen interesse</button>
      </div>
    </div>`;
}

function renderDropdown(campaign, isFinal) {
  return `
    <div class="coreg-section ${isFinal ? "final-coreg" : ""}" id="campaign-${campaign.id}">
      <img src="https://cms.core.909play.com/assets/${campaign.image.id}" alt="${campaign.title}" class="coreg-image" />
      <h3 class="coreg-title">${campaign.title}</h3>
      <p class="coreg-description">${campaign.description}</p>
      <select class="coreg-dropdown" data-campaign="${campaign.id}" data-cid="${campaign.cid}" data-sid="${campaign.sid}">
        <option value="">Maak een keuze...</option>
        ${campaign.coreg_dropdown_options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join("")}
      </select>
      <a href="#" class="skip-link" data-answer="no" data-campaign="${campaign.id}">Geen interesse, sla over</a>
    </div>`;
}

function renderMultistep(campaign, isFinal) {
  return `
    <div class="coreg-section" id="campaign-${campaign.id}-step1">
      <img src="https://cms.core.909play.com/assets/${campaign.image.id}" alt="${campaign.title}" class="coreg-image" />
      <h3 class="coreg-title">${campaign.title}</h3>
      <p class="coreg-description">${campaign.description}</p>
      <button class="flow-next sponsor-next next-step-campaign-${campaign.id}-step2" data-answer="yes" data-campaign="${campaign.id}" data-cid="${campaign.cid}" data-sid="${campaign.sid}">
        Ja, graag
      </button>
      <button class="flow-next skip-next" data-answer="no" data-campaign="${campaign.id}">Nee, geen interesse</button>
    </div>
    <div class="coreg-section ${isFinal ? "final-coreg" : ""}" id="campaign-${campaign.id}-step2" style="display:none">
      <img src="https://cms.core.909play.com/assets/${campaign.image.id}" alt="${campaign.title}" class="coreg-image" />
      <h3 class="coreg-title">Wie is je huidige energieleverancier?</h3>
      <select class="coreg-dropdown" data-campaign="${campaign.id}" data-cid="${campaign.cid}" data-sid="${campaign.sid}">
        <option value="">Kies je huidige leverancier...</option>
        ${campaign.coreg_dropdown_options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join("")}
      </select>
      <a href="#" class="skip-link" data-answer="no" data-campaign="${campaign.id}">Toch geen interesse</a>
    </div>`;
}

function renderCampaign(campaign, isFinal) {
  if (campaign.hasCoregFlow) return renderMultistep(campaign, isFinal);
  if (campaign.type === "dropdown") return renderDropdown(campaign, isFinal);
  return renderSingle(campaign, isFinal);
}

async function sendLead(cid, sid, answer) {
  try {
    const payload = { cid, sid, answer };
    await fetch(API_LEAD, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("Lead versturen mislukt:", err);
  }
}

async function initCoregFlow() {
  const container = document.getElementById("coreg-container");
  if (!container) return;

  const campaigns = await fetchCampaigns();
  campaigns.forEach((camp, i) => {
    const isFinal = i === campaigns.length - 1;
    container.innerHTML += renderCampaign(camp, isFinal);
  });

  const sections = Array.from(container.querySelectorAll(".coreg-section"));
  sections.forEach((s, i) => (s.style.display = i === 0 ? "block" : "none"));

  function showNextSection(current) {
    const idx = sections.indexOf(current);
    if (idx > -1 && idx < sections.length - 1) {
      current.style.display = "none";
      sections[idx + 1].style.display = "block";
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (current.classList.contains("final-coreg")) {
      handleFinalCoreg(current);
    }
  }

  function handleFinalCoreg(current) {
    let hasTmPositive = false;
    campaigns.forEach(camp => {
      const answer = sessionStorage.getItem(`coreg_answer_${camp.id}`);
      if (camp.requiresLongForm && answer === "yes") {
        hasTmPositive = true;
      }
    });

    const longForm = document.getElementById("long-form-section");
    current.style.display = "none";
    if (longForm) {
      if (hasTmPositive) {
        longForm.style.display = "block";
      } else {
        longForm.style.display = "none";
        const allSteps = Array.from(document.querySelectorAll(".flow-section, .coreg-section"));
        const idx = allSteps.indexOf(longForm);
        if (idx > -1 && allSteps[idx + 1]) {
          allSteps[idx + 1].style.display = "block";
        }
      }
    }
  }

  // Event listeners
  sections.forEach(section => {
    const dropdown = section.querySelector(".coreg-dropdown");
    if (dropdown) {
      dropdown.addEventListener("change", () => {
        if (dropdown.value !== "") {
          sessionStorage.setItem(`coreg_answer_${dropdown.dataset.campaign}`, "yes");
          sendLead(dropdown.dataset.cid, dropdown.dataset.sid, dropdown.value);
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
        if (answer === "yes") sendLead(cid, sid, answer);

        if (btn.classList.contains("sponsor-next")) {
          const nextStep = section.nextElementSibling;
          section.style.display = "none";
          if (nextStep) nextStep.style.display = "block";
        } else if (btn.classList.contains("skip-next")) {
          showNextSection(section.nextElementSibling || section);
        } else {
          showNextSection(section);
        }
      });
    });
  });
}

window.addEventListener("DOMContentLoaded", initCoregFlow);
