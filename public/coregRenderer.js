// coregRenderer.js
// Dynamische Coreg renderer – volledig Directus-driven, inclusief multistep fix en skip logic

if (typeof window.API_COREG === "undefined") {
  window.API_COREG = "https://globalcoregflow-nl.vercel.app/api/coreg.js";
}
const API_COREG = window.API_COREG;

// ============ Helper: afbeelding-url ============
function getImageUrl(image) {
  if (!image) return "https://via.placeholder.com/600x200?text=Geen+afbeelding";
  return image.id
    ? `https://cms.core.909play.com/assets/${image.id}`
    : image.url || "https://via.placeholder.com/600x200?text=Geen+afbeelding";
}

// ============ Data ophalen ============
async function fetchCampaigns() {
  try {
    const res = await fetch(API_COREG);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    console.log("📦 Directus campagnes:", json.data?.length);
    return json.data || [];
  } catch (err) {
    console.error("❌ Coreg fetch error:", err);
    return [];
  }
}

// ============ Lead versturen ============
async function sendLeadToDatabowl(payload) {
  try {
    // unieke suffix voorkomt dubbele blokkeert
    const result = await window.fetchLead({ ...payload, unique: crypto.randomUUID() });
    console.log("✅ Lead verstuurd:", { cid: payload.cid, sid: payload.sid, answer: payload.f_2014_coreg_answer });
    return result;
  } catch (e) {
    console.error("❌ Lead fout:", e);
  }
}

// ============ Payload helper ============
function buildCoregPayload(campaign, answerValue) {
  const cid = answerValue?.cid ?? campaign.cid;
  const sid = answerValue?.sid ?? campaign.sid;

  const payload = window.buildPayload({
    cid,
    sid,
    coregAnswerKey: `coreg_answer_${campaign.id}`,
  });
  payload.f_2014_coreg_answer = answerValue?.answer_value || answerValue || "";
  return payload;
}

// ============ Rendering ============
function renderCampaignBlock(campaign, steps) {
  const answers = campaign.coreg_answers || [];
  const style = campaign.ui_style?.toLowerCase() || "buttons";
  const visible = steps && campaign.step > 1 ? "none" : "block";
  const isFinal = campaign.isFinal ? "final-coreg" : "";

  // === DROPDOWN ===
  if (style === "dropdown") {
    return `
      <div class="coreg-section ${isFinal}" id="campaign-${campaign.id}" style="display:${visible}">
        <img src="${getImageUrl(campaign.image)}" class="coreg-image" alt="${campaign.title}" />
        <h3 class="coreg-title">${campaign.title}</h3>
        <p class="coreg-description">${campaign.description || ""}</p>
        <select class="coreg-dropdown" data-campaign="${campaign.id}" data-cid="${campaign.cid}" data-sid="${campaign.sid}">
          <option value="">Maak een keuze...</option>
          ${answers.map(opt => `
            <option value="${opt.answer_value}"
                    data-cid="${opt.has_own_campaign ? opt.cid : campaign.cid}"
                    data-sid="${opt.has_own_campaign ? opt.sid : campaign.sid}">
              ${opt.label}
            </option>`).join("")}
        </select>
        <a href="#" class="skip-link" data-campaign="${campaign.id}">Geen interesse, sla over</a>
      </div>`;
  }

  // === BUTTONS ===
  const hasNo = answers.some(a => a.answer_value?.toLowerCase() === "no");
  return `
    <div class="coreg-section ${isFinal}" id="campaign-${campaign.id}" style="display:${visible}">
      <img src="${getImageUrl(campaign.image)}" class="coreg-image" alt="${campaign.title}" />
      <h3 class="coreg-title">${campaign.title}</h3>
      <p class="coreg-description">${campaign.description || ""}</p>
      <div class="coreg-answers">
        ${answers.map(opt => `
          <button class="flow-next btn-answer"
                  data-answer="${opt.answer_value || "yes"}"
                  data-campaign="${campaign.id}"
                  data-cid="${opt.has_own_campaign ? opt.cid : campaign.cid}"
                  data-sid="${opt.has_own_campaign ? opt.sid : campaign.sid}">
            ${opt.label}
          </button>`).join("")}
        ${!hasNo ? `
        <button class="flow-next btn-skip" data-answer="no" data-campaign="${campaign.id}">
          Nee, geen interesse
        </button>` : ""}
      </div>
    </div>`;
}

// ============ Renderer ============
async function initCoregFlow() {
  const container = document.getElementById("coreg-container");
  if (!container) return;

  const campaigns = await fetchCampaigns();
  window.allCampaigns = campaigns;

  // Sorteren op order en step
  const ordered = [...campaigns].sort((a, b) => (a.order || 0) - (b.order || 0));
  const grouped = {};

  // Groepeer multi-step campagnes per cid
  for (const camp of ordered) {
    if (camp.has_coreg_flow) {
      grouped[camp.cid] = grouped[camp.cid] || [];
      grouped[camp.cid].push(camp);
    }
  }

  // UI container
  container.innerHTML = `
    <div class="coreg-inner">
      <div class="ld-progress-wrap mb-25">
        <div class="ld-progress-info">
          <span class="progress-label">Je bent er bijna</span>
          <span class="progress-value text-primary">0%</span>
        </div>
        <div class="ld-progress lh-8" role="progressbar" data-progress="0">
          <div class="progress-bar" style="width:0%;"></div>
        </div>
      </div>
      <div id="coreg-sections"></div>
    </div>`;

  const sectionsContainer = container.querySelector("#coreg-sections");

  // Render campagnes
  ordered.forEach((camp, idx) => {
    const isFinal = idx === ordered.length - 1;
    camp.isFinal = isFinal;
    if (camp.has_coreg_flow && grouped[camp.cid]) {
      grouped[camp.cid].forEach(step => {
        sectionsContainer.innerHTML += renderCampaignBlock(step, true);
      });
    } else {
      sectionsContainer.innerHTML += renderCampaignBlock(camp, false);
    }
  });

  const sections = Array.from(sectionsContainer.querySelectorAll(".coreg-section"));
  sections.forEach((s, i) => (s.style.display = i === 0 ? "block" : "none"));

  // ========== Navigatie ==========
  function updateProgressBar(sectionIdx) {
    const total = sections.length;
    const current = Math.max(1, Math.min(sectionIdx + 1, total));
    const percent = Math.round((current / total) * 100);
    const wrap = container.querySelector('.ld-progress[role="progressbar"]');
    const val = container.querySelector('.progress-value.text-primary');
    if (wrap) {
      wrap.setAttribute("data-progress", percent);
      wrap.querySelector(".progress-bar").style.width = percent + "%";
    }
    if (val) val.textContent = percent + "%";
  }

  function showNextSection(current) {
    const idx = sections.indexOf(current);
    if (idx < sections.length - 1) {
      current.style.display = "none";
      sections[idx + 1].style.display = "block";
      updateProgressBar(idx + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      handleFinalCoreg();
    }
  }

  // ========== Final logic ==========
  function handleFinalCoreg() {
    const hasLongForm = campaigns.some(c => c.requires_long_form);
    if (hasLongForm) {
      const btn = document.getElementById("coreg-longform-btn");
      if (btn) btn.click();
    } else {
      const fin = document.getElementById("coreg-finish-btn");
      if (fin) fin.click();
    }
  }

  // ========== Event Listeners ==========
  sections.forEach(section => {
    // === DROPDOWN ===
    const dropdown = section.querySelector(".coreg-dropdown");
    if (dropdown) {
      dropdown.addEventListener("change", e => {
        const opt = e.target.selectedOptions[0];
        if (!opt || !opt.value) return;
        const camp = campaigns.find(c => c.id == dropdown.dataset.campaign);
        const cid = opt.dataset.cid;
        const sid = opt.dataset.sid;
        const answerValue = { answer_value: opt.value, cid, sid };

        // multistep check
        if (camp.has_coreg_flow) {
          const group = grouped[camp.cid];
          const isLastStep = camp.step === group[group.length - 1].step;
          if (!isLastStep) {
            sessionStorage.setItem(`pending_coreg_${camp.cid}`, JSON.stringify(answerValue));
            showNextSection(section);
            return;
          }
        }

        const payload = buildCoregPayload(camp, answerValue);
        sendLeadToDatabowl(payload);
        showNextSection(section);
      });
    }

    // === SKIP ===
    section.querySelectorAll(".btn-skip, .skip-link").forEach(btn => {
      btn.addEventListener("click", e => {
        e.preventDefault();
        showNextSection(section);
      });
    });

    // === BUTTONS ===
    section.querySelectorAll(".btn-answer").forEach(btn => {
      btn.addEventListener("click", () => {
        const camp = campaigns.find(c => c.id == btn.dataset.campaign);
        const cid = btn.dataset.cid;
        const sid = btn.dataset.sid;
        const answerValue = { answer_value: btn.dataset.answer, cid, sid };

        // multistep check
        if (camp.has_coreg_flow) {
          const group = grouped[camp.cid];
          const isLastStep = camp.step === group[group.length - 1].step;
          if (!isLastStep) {
            sessionStorage.setItem(`pending_coreg_${camp.cid}`, JSON.stringify(answerValue));
            showNextSection(section);
            return;
          }
        }

        const payload = buildCoregPayload(camp, answerValue);
        sendLeadToDatabowl(payload);
        showNextSection(section);
      });
    });
  });
}

window.addEventListener("DOMContentLoaded", initCoregFlow);
