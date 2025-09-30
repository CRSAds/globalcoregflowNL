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

function renderProgressBar(currentIdx, total) {
  let stepsHtml = '';
  for (let i = 0; i < total; i++) {
    let cls = 'progress-step';
    if (i < currentIdx) cls += ' completed';
    if (i === currentIdx) cls += ' active';
    if (i === total - 1) cls += ' trophy';
    stepsHtml += `<div class="${cls}">${i === total-1 ? '🏆' : i+1}</div>`;
  }
  return `
    <div class=\"progress-bar-container\">
      <div class=\"progress-bar-track\">
        <div class=\"progress-bar-fill\" style=\"width:${(currentIdx/(total-1))*100}%;\"></div>
        <div class=\"progress-bar-steps\">${stepsHtml}</div>
      </div>
    </div>`;
}

function renderSingle(campaign, isFinal, idx, total, progressIdx) {
  return `
    <div class="coreg-section ${isFinal ? "final-coreg" : ""}" id="campaign-${campaign.id}">
      <div class="coreg-inner">
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
  // Multistep stap 2 fix: zoek de campagne met leveranciers-opties (zelfde cid, type: 'dropdown')
  let dropdownCampaign = campaign;
  if (window.allCampaigns && Array.isArray(window.allCampaigns)) {
    const found = window.allCampaigns.find(c => c.cid === campaign.cid && c.type === 'dropdown');
    if (found) dropdownCampaign = found;
  }
  const dropdownOptions = dropdownCampaign.coreg_dropdown_options || [];
  console.log("[DEBUG] renderMultistep stap 2 gebruikt campaign id:", dropdownCampaign.id, dropdownOptions);

  return `
    <div class="coreg-section" id="campaign-${campaign.id}-step1">
      <div class="coreg-inner">
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

async function sendLead(cid, sid, answer, isTM = false, storeOnly = false) {
  try {
    const payload = {
      cid,
      sid,
      answer,
      ...getShortFormData()
    };

    if (isTM || storeOnly) {
      // TM: opslaan voor later
      let tmLeads = JSON.parse(sessionStorage.getItem('pendingTMLeads') || '[]');
      tmLeads = tmLeads.filter(l => l.cid !== cid || l.sid !== sid); // voorkom dubbele
      tmLeads.push(payload);
      sessionStorage.setItem('pendingTMLeads', JSON.stringify(tmLeads));
      console.log('[TM] Lead opgeslagen voor later versturen:', payload);
      return;
    }

    // EM: direct versturen
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

// Functie om alle opgeslagen TM leads te versturen
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


// --- Progress Bar Logic ---
function renderProgressBar(currentIdx, total) {
  const root = document.getElementById('progress-bar-root');
  if (!root) return;
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
}

async function initCoregFlow() {
  const container = document.getElementById("coreg-container");
  if (!container) return;

  const campaigns = await fetchCampaigns();
  window.allCampaigns = campaigns;
  console.log("Campagne response:", campaigns); // Toegevoegd voor debug

  // ✅ Multistep fix: filter losse stap 2 als onderdeel van multistep
  const filteredCampaigns = campaigns.filter(c => {
    if (c.type === "dropdown" && campaigns.find(p => p.hasCoregFlow && p.cid === c.cid)) {
      return false;
    }
    return true;
  });

  filteredCampaigns.forEach((camp, i) => {
    const isFinal = i === filteredCampaigns.length - 1;
    container.innerHTML += renderCampaign(camp, isFinal);
  });

  const sections = Array.from(container.querySelectorAll(".coreg-section"));
  sections.forEach((s, i) => (s.style.display = i === 0 ? "block" : "none"));

  // Progress bar init
  let progressIdx = 0;
  renderProgressBar(progressIdx, sections.length);

  function showNextSection(current) {
    const idx = sections.indexOf(current);
    if (idx > -1 && idx < sections.length - 1) {
      current.style.display = "none";
      sections[idx + 1].style.display = "block";
      progressIdx = Math.min(idx + 1, sections.length - 1);
      renderProgressBar(progressIdx, sections.length);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (current.classList.contains("final-coreg")) {
      progressIdx = sections.length - 1;
      renderProgressBar(progressIdx, sections.length);
      handleFinalCoreg(current);
    }
  }

  // Toon long form als er positieve TM leads zijn, anders funnel direct door
  function handleFinalCoreg(current) {
    current.style.display = "none";
    // Multistep: ALLE stappen moeten positief zijn voor long form
    let hasTmPositive = false;
    window.allCampaigns.forEach(camp => {
      if (camp.requiresLongForm) {
        if (camp.hasCoregFlow) {
          const step1 = sessionStorage.getItem(`coreg_answer_${camp.id}`);
          const dropdownCamp = window.allCampaigns.find(c => c.cid === camp.cid && c.type === 'dropdown');
          const step2 = dropdownCamp ? sessionStorage.getItem(`coreg_answer_${dropdownCamp.id}`) : null;
          if (step1 === "yes" && step2 === "yes") {
            hasTmPositive = true;
          }
        } else {
          const answer = sessionStorage.getItem(`coreg_answer_${camp.id}`);
          if (answer === "yes") {
            hasTmPositive = true;
          }
        }
      }
    });

    // Sluit coreg sectie altijd
    document.querySelectorAll('.coreg-section').forEach(s => s.style.display = 'none');
    const coregContainer = document.getElementById("coreg-container");
    if (coregContainer) coregContainer.style.display = "none";

    const longForm = document.getElementById("long-form-section");
    if (longForm) {
      if (hasTmPositive) {
        longForm.style.display = "block";
        longForm.offsetHeight; // force repaint
        window.dispatchEvent(new Event('resize'));
        // Verwijder eventueel lazy-loading attribuut van img
        const imgs = longForm.querySelectorAll('img[loading="lazy"]');
        imgs.forEach(img => img.removeAttribute('loading'));
        // Forceer Swipepages lazyload images
        const lazyImgs = longForm.querySelectorAll('img.tatsu-image-lazyload');
        lazyImgs.forEach(img => {
          const src = img.getAttribute('src');
          if (src) img.src = src;
        });
        setTimeout(() => {
          window.dispatchEvent(new Event('scroll'));
          window.scrollBy(0, 1);
          window.scrollBy(0, -1);
          window.scrollTo({ top: longForm.offsetTop, behavior: "smooth" });
        }, 30);
      } else {
        longForm.style.display = "none";
        // Funnel direct door naar volgende sectie
        const finishBtn = document.getElementById("coreg-finish-btn");
        if (finishBtn) finishBtn.click();
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
          // Bepaal of het een TM of EM campagne is
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

  // Voeg een globale functie toe om na long form alle TM leads te versturen
  window.sendAllTMLeads = sendAllTMLeads;

}

window.addEventListener("DOMContentLoaded", initCoregFlow);