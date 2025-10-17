// coregRenderer.js — Debug versie met uitgebreide logging

if (typeof window.API_COREG === "undefined") {
  window.API_COREG = "https://globalcoregflow-nl.vercel.app/api/coreg.js";
}
const API_COREG = window.API_COREG;

// ============ Helper ============
function getImageUrl(image) {
  if (!image) return "https://via.placeholder.com/600x200?text=Geen+afbeelding";
  return image.id
    ? `https://cms.core.909play.com/assets/${image.id}`
    : image.url || "https://via.placeholder.com/600x200?text=Geen+afbeelding";
}

// ============ Fetch campagnes ============
async function fetchCampaigns() {
  try {
    const res = await fetch(
    "https://globalcoregflow-nl.vercel.app/api/coreg.js",
  { cache: "no-store" }
  );
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
  console.log("🚦 sendLeadToDatabowl() aangeroepen:", payload);
  try {
    const result = await window.fetchLead(payload);
    console.log("✅ Lead verstuurd via fetchLead:", result);
    return result;
  } catch (e) {
    console.error("❌ Fout in sendLeadToDatabowl:", e);
  }
}

// ============ Payload bouwen ============
function buildCoregPayload(campaign, answerValue) {
  console.log("🧩 buildCoregPayload() → input:", { campaign, answerValue });

  const cid = answerValue?.cid || campaign.cid;
  const sid = answerValue?.sid || campaign.sid;

  const payload = window.buildPayload({
    cid,
    sid,
    coregAnswerKey: `coreg_answer_${campaign.id}`
  });

  payload.f_2014_coreg_answer = answerValue?.answer_value || answerValue || "";
  console.log("📦 buildCoregPayload() → output:", payload);

  return payload;
}

// ============ Rendering ============
function renderCampaignBlock(campaign, steps) {
  const answers = campaign.coreg_answers || [];
  const style = campaign.ui_style?.toLowerCase() || "buttons";
  const visible = steps && campaign.step > 1 ? "none" : "block";
  const isFinal = campaign.isFinal ? "final-coreg" : "";

  if (style === "dropdown") {
    return `
    <div class="coreg-section ${isFinal}" id="campaign-${campaign.id}" data-cid="${campaign.cid}" data-sid="${campaign.sid}" style="display:${visible}">
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

  // default → buttons
  return `
    <div class="coreg-section ${isFinal}" id="campaign-${campaign.id}" data-cid="${campaign.cid}" data-sid="${campaign.sid}" style="display:${visible}">
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
        <button class="flow-next btn-skip"
          data-answer="no"
          data-campaign="${campaign.id}"
          data-cid="${campaign.cid}"
          data-sid="${campaign.sid}">
        Nee, geen interesse
        </button>
      </div>
    </div>`;
}

// ============ Renderer ============
async function initCoregFlow() {
  console.log("🚀 initCoregFlow gestart");

  const container = document.getElementById("coreg-container");
  if (!container) {
    console.warn("⚠️ Geen #coreg-container gevonden");
    return;
  }

  const campaigns = await fetchCampaigns();
  window.allCampaigns = campaigns;

  console.log("📊 Campagnes geladen:", campaigns);

  // Sorteren op volgorde
  const ordered = [...campaigns].sort((a, b) => (a.order || 0) - (b.order || 0));
  const grouped = {};
  for (const camp of ordered) {
    if (camp.has_coreg_flow) {
      grouped[camp.cid] = grouped[camp.cid] || [];
      grouped[camp.cid].push(camp);
    }
  }

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
      console.log("🏁 Laatste coreg bereikt – einde flow");
      handleFinalCoreg();
    }
  }

  function handleFinalCoreg() {
    console.log("🏁 handleFinalCoreg aangeroepen");
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
  // Dropdowns
  const dropdown = section.querySelector(".coreg-dropdown");
  if (dropdown) {
    dropdown.addEventListener("change", e => {
      const opt = e.target.selectedOptions[0];
      if (!opt || !opt.value) return;
      const camp = campaigns.find(c => c.id == dropdown.dataset.campaign);
      const answerValue = {
        answer_value: opt.value,
        cid: opt.dataset.cid,
        sid: opt.dataset.sid
      };
      console.log("🟢 Dropdown keuze →", answerValue);

        // Sla dropdownwaarde op voor Databowl-veld
  sessionStorage.setItem("f_2575_coreg_answer_dropdown", opt.value);
  console.log("💾 Dropdown opgeslagen in sessionStorage:", opt.value);

      // Bepaal of dit de laatste stap is voor deze sponsor (zelfde cid)
      const idx = sections.indexOf(section);
      const currentCid = String(camp.cid ?? "");
      const hasMoreSteps = sections
        .slice(idx + 1)
        .some(s => String(s.dataset.cid || "") === currentCid);

      if (hasMoreSteps) {
        console.log("⏭️ Multistep actief (dropdown) → nog NIET posten, door naar volgende stap");
        showNextSection(section);
      } else {
        if (camp.requiresLongForm) {
          // 🧩 Longform campagne → nog NIET posten, eerst formulier laten invullen
          console.log("🕓 Longform campagne gedetecteerd → wacht op formulier voor verzending:", camp.cid);
          const pending = JSON.parse(sessionStorage.getItem("longFormCampaigns") || "[]");
          if (!pending.find(p => p.cid === camp.cid && p.sid === camp.sid)) {
            pending.push({ cid: camp.cid, sid: camp.sid });
            sessionStorage.setItem("longFormCampaigns", JSON.stringify(pending));
          }
          showNextSection(section);
        } else {
          // 📤 Geen longform → direct verzenden
          const payload = buildCoregPayload(camp, answerValue);
          console.log("🚦 POST naar /api/lead gestart (laatste stap):", payload);
          sendLeadToDatabowl(payload);
          showNextSection(section);
        }
      }
    });
  }

  // Skip links
  const skip = section.querySelector(".skip-link");
  if (skip) {
    skip.addEventListener("click", e => {
      e.preventDefault();
      console.log("⏭️ Skip link gebruikt bij:", skip.dataset.campaign);
      showNextSection(section);
    });
  }

  // Buttons (positief/negatief + multistep)
  section.querySelectorAll(".btn-answer, .btn-skip").forEach(btn => {
    btn.addEventListener("click", () => {
      const camp = campaigns.find(c => c.id == btn.dataset.campaign);
      const answerValue = {
        answer_value: btn.dataset.answer,
        cid: btn.dataset.cid,
        sid: btn.dataset.sid
      };
      console.log("🟢 Button klik →", answerValue);

      // Negatief als: expliciete skip-knop of tekst bevat nee/geen interesse/sla over of answer_value === "no"
      const labelText = btn.textContent.toLowerCase();
      const answerVal = (btn.dataset.answer || "").toLowerCase();
      const isNegative =
        btn.classList.contains("btn-skip") ||
        /(^|\s)(nee|geen interesse|sla over)(\s|$)/i.test(labelText) ||
        answerVal === "no";

      const isPositive = !isNegative; // alles wat geen 'nee' is, is positief (dus ook Volkskrant/AD/etc.)

      if (isPositive) {
        // Multistep: alleen posten bij de laatste stap van dezelfde sponsor
        const idx = sections.indexOf(section);
        const currentCid = String(camp.cid ?? "");
        const hasMoreSteps = sections.slice(idx + 1).some(s => String(s.dataset.cid || "") === currentCid);

        if (camp.requiresLongForm) {
        sessionStorage.setItem("requiresLongForm", "true");
        console.log("📋 Longform-sponsor positief beantwoord:", camp.cid);
        }

        if (hasMoreSteps) {
          console.log("⏭️ Multistep actief → nog NIET posten, door naar volgende stap");
          showNextSection(section);
        } else {
          if (camp.requiresLongForm) {
            // 🧩 Longform campagne → nog NIET posten, eerst formulier laten invullen
            console.log("🕓 Longform campagne gedetecteerd → wacht op formulier voor verzending:", camp.cid);
            const pending = JSON.parse(sessionStorage.getItem("longFormCampaigns") || "[]");
            if (!pending.find(p => p.cid === camp.cid && p.sid === camp.sid)) {
              pending.push({ cid: camp.cid, sid: camp.sid });
              sessionStorage.setItem("longFormCampaigns", JSON.stringify(pending));
            }
            showNextSection(section);
          } else {
            // 📤 Geen longform → direct verzenden
            const payload = buildCoregPayload(camp, answerValue);
            console.log("🚦 POST naar /api/lead gestart (laatste stap):", payload);
            sendLeadToDatabowl(payload);
            showNextSection(section);
          }
        }
      } else {
        // Negatief → geen lead posten, alle vervolgstappen van dezelfde sponsor overslaan
        console.log("⏭️ Negatief antwoord → vervolgstappen van dezelfde sponsor overslaan");
        const idx = sections.indexOf(section);
        const currentCid = String(camp.cid ?? "");
        let j = idx + 1;
        while (j < sections.length && String(sections[j].dataset.cid || "") === currentCid) {
          j++;
        }
        section.style.display = "none";
        if (j < sections.length) {
          sections[j].style.display = "block";
          updateProgressBar(j);
        } else {
          handleFinalCoreg();
        }
      }
    });
  });
});

} 
window.addEventListener("DOMContentLoaded", initCoregFlow);
