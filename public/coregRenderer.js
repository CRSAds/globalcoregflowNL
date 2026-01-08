// =============================================================
// ✅ coregRenderer.js — productieversie met minimale logging
// =============================================================

if (typeof window.API_COREG === "undefined") {
  window.API_COREG = "https://globalcoregflow-nl.vercel.app/api/coreg.js";
}
const API_COREG = window.API_COREG;

// =============================================================
// ✅ COREG PAD SELECTIE (via URL) + FILTER HELPER
// =============================================================
const COREG_PATHS = window.coregPaths || {
  default: { mode: "all" }
};

const urlParams = new URLSearchParams(window.location.search);
const status = urlParams.get("status");
const coregParam = urlParams.get("coreg");

let activeCoregPath = COREG_PATHS.default;
let activeCoregPathKey = "default";

// 🔑 STATUS-OVERRIDE
if (status === "energie" && COREG_PATHS.energie_direct) {
  activeCoregPath = COREG_PATHS.energie_direct;
  activeCoregPathKey = "energie_direct";
}
// 🔁 BACKWARD COMPATIBLE: ?coreg= blijft werken
else if (coregParam && COREG_PATHS[coregParam]) {
  activeCoregPath = COREG_PATHS[coregParam];
  activeCoregPathKey = coregParam;
}

// Filter campaigns obv pad:
// - default (mode: all): alles laten staan
// - keys: alleen campaigns met coreg_key in steps
//   + belangrijk: als een campaign meerdere stappen heeft (zelfde cid),
//     dan nemen we ALLE stappen mee zodra 1 stap/campaign binnen de keys valt.
function applyCoregPathFilter(campaigns, coregPath) {
  // ✅ Alleen standaard pad mag uitsluiten toepassen
  if (activeCoregPathKey === "default") {
    return campaigns.filter(c => !c.uitsluiten_standaardpad);
  }

  // ✅ Alle niet-default paden: NOOIT uitsluiten_standaardpad toepassen
  if (coregPath && coregPath.mode === "keys") {
    const keys = coregPath.steps || [];

    const filtered = campaigns.filter(
      c => c.coreg_key && keys.includes(c.coreg_key)
    );

    // (optionele sort blijft prima)
    if (keys.length > 0) {
      const cidOrder = keys
        .map(k => campaigns.find(c => c.coreg_key === k)?.cid)
        .filter(Boolean);

      filtered.sort((a, b) => {
        const ai = cidOrder.indexOf(a.cid);
        const bi = cidOrder.indexOf(b.cid);
        return (ai === -1 ? 9999 : ai) - (bi === -1 ? 9999 : bi);
      });
    }

    return filtered;
  }

  // fallback: als iemand een onbekend pad meegeeft, toon alles (zonder uitsluiten)
  return campaigns;
}

// =============================================================
// 🔧 Logging toggle
// =============================================================
const DEBUG = false; // Zet op true tijdens testen
const log   = (...args) => { if (DEBUG) console.log(...args); };
const warn  = (...args) => { if (DEBUG) console.warn(...args); };
const error = (...args) => console.error(...args); // errors altijd zichtbaar

// =============================================================
// Helper
// =============================================================
function getImageUrl(image) {
  if (!image) return "https://via.placeholder.com/600x200?text=Geen+afbeelding";
  return image.id
    ? `https://cms.core.909play.com/assets/${image.id}`
    : image.url || "https://via.placeholder.com/600x200?text=Geen+afbeelding";
}

// =============================================================
// ✅ MINIMALE FIX: alleen coreg answer opslaan (geen payload/lead/flow)
// =============================================================
function storeCoregAnswerOnly(campaign, answerValue) {
  if (!campaign) return;

  // zorg dat cid bestaat
  if (!answerValue?.cid) answerValue.cid = campaign.cid;

  const cid = answerValue.cid;
  const key = `coreg_answers_${cid}`;
  const prev = JSON.parse(sessionStorage.getItem(key) || "[]");

  const ans = answerValue?.answer_value;
  if (ans && !prev.includes(ans)) {
    prev.push(ans);
    sessionStorage.setItem(key, JSON.stringify(prev));
  }

  // altijd string updaten (ook als leeg)
  const combined = prev.join(" - ");
  sessionStorage.setItem(`f_2014_coreg_answer_${cid}`, combined);
}

// =============================================================
// Renderer
// =============================================================
function renderCampaignBlock(campaign, steps) {
  const answers = campaign.coreg_answers || [];
  const style = campaign.ui_style?.toLowerCase() || "buttons";
  const visible = steps && campaign.step > 1 ? "none" : "block";
  const isFinal = campaign.isFinal ? "final-coreg" : "";

  if (style === "dropdown") {
    return `
      <div class="coreg-section ${isFinal}" id="campaign-${campaign.id}"
           data-cid="${campaign.cid}" data-sid="${campaign.sid}"
           style="display:${visible}">
        <img src="${getImageUrl(campaign.image)}" class="coreg-image" alt="${campaign.title}">
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

  // JA / NEE buttons
  return `
    <div class="coreg-section ${isFinal}" id="campaign-${campaign.id}"
         data-cid="${campaign.cid}" data-sid="${campaign.sid}"
         style="display:${visible}">
      <img src="${getImageUrl(campaign.image)}" class="coreg-image" alt="${campaign.title}">
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
          </button>`
        ).join("")}

        <button class="flow-next btn-skip"
          data-answer="no"
          data-campaign="${campaign.id}"
          data-cid="${campaign.cid}"
          data-sid="${campaign.sid}">
          Nee, geen interesse
        </button>
      </div>

      ${campaign.more_info ? `<div class="coreg-more-info">${campaign.more_info}</div>` : ""}
    </div>`;
}

// =============================================================
// Fetch Campagnes
// =============================================================
async function fetchCampaigns() {
  try {
    const res = await fetch(API_COREG, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();
    log("Campagnes geladen:", json.data?.length);

    return json.data || [];
  } catch (err) {
    error("❌ Coreg fetch error:", err);
    return [];
  }
}

// =============================================================
// Payload opbouwen
// =============================================================
async function buildCoregPayload(campaign, answerValue) {
  log("buildCoregPayload IN:", { campaign, answerValue });

  if (!answerValue?.cid) answerValue.cid = campaign.cid;
  if (!answerValue?.sid) answerValue.sid = campaign.sid;

  const cid = answerValue.cid;
  const sid = answerValue.sid;

  const key = `coreg_answers_${cid}`;
  const prev = JSON.parse(sessionStorage.getItem(key) || "[]");

  const ans = answerValue.answer_value;
  if (ans && !prev.includes(ans)) {
    prev.push(ans);
    sessionStorage.setItem(key, JSON.stringify(prev));
  }

  const combined = prev.join(" - ");
  sessionStorage.setItem(`f_2014_coreg_answer_${cid}`, combined);

  const payload = await window.buildPayload({
    cid,
    sid,
    is_shortform: false,
    f_2014_coreg_answer: combined
  });

  const dropdown = sessionStorage.getItem(`f_2575_coreg_answer_dropdown_${cid}`);
  if (dropdown) payload.f_2575_coreg_answer_dropdown = dropdown;

  log("buildCoregPayload OUT:", payload);
  return payload;
}

// =============================================================
// Coreg Flow
// =============================================================
async function initCoregFlow() {
  log("initCoregFlow gestart");

  // Reset state
  sessionStorage.setItem("requiresLongForm", "false");
  sessionStorage.removeItem("longFormCampaigns");

  const container = document.getElementById("coreg-container");
  if (!container) return;

  let campaigns = await fetchCampaigns();
  campaigns = applyCoregPathFilter(campaigns, activeCoregPath);
  
  window.allCampaigns = campaigns;
  
  if (DEBUG) {
    log("🧭 Actief coregpad:", activeCoregPathKey);
    log("📌 Campaigns na filter:", campaigns.length);
  }

  // Normalize longform
  campaigns.forEach(c => {
    c.requiresLongForm =
      c.requiresLongForm === true ||
      c.requiresLongForm === "true" ||
      c.requires_long_form === true ||
      c.requires_long_form === "true";
  });

  // Sort + group
  const ordered = [...campaigns].sort((a, b) => (a.order || 0) - (b.order || 0));
  const grouped = {};
  ordered.forEach(c => {
    if (c.has_coreg_flow) {
      grouped[c.cid] ??= [];
      grouped[c.cid].push(c);
    }
  });

  // Render
  container.innerHTML = `
    <div class="coreg-inner">
      <div class="coreg-header">
        <h2 id="coreg-motivation" class="coreg-motivation">Nog enkele vragen om je deelname af te ronden 🎯</h2>
      </div>
      <div class="ld-progress-wrap mb-25">
        <div class="ld-progress-info">
          <span class="progress-label">Afronden van je deelname</span>
          <span class="progress-value text-primary">25%</span>
        </div>
        <div class="ld-progress" role="progressbar" data-progress="25">
          <div class="progress-bar" style="width:0%"></div>
        </div>
      </div>
      <div id="coreg-sections"></div>
    </div>`;

  // 🔑 Start progress-animatie direct na render
  const progressEl = container.querySelector(".ld-progress");
  if (progressEl && window.animateProgressBar) {
    requestAnimationFrame(() => {
    window.animateProgressBar(progressEl);
  });
  }

  const sectionsContainer = container.querySelector("#coreg-sections");

  ordered.forEach((camp, idx) => {
    camp.isFinal = idx === ordered.length - 1;
    if (grouped[camp.cid]) {
      grouped[camp.cid].forEach(step =>
        sectionsContainer.innerHTML += renderCampaignBlock(step, true)
      );
    } else {
      sectionsContainer.innerHTML += renderCampaignBlock(camp, false);
    }
  });

  const sections = [...sectionsContainer.querySelectorAll(".coreg-section")];
  sections.forEach((s, i) => (s.style.display = i === 0 ? "block" : "none"));

  // Progress bar + next-step logic (ongewijzigd behalve logs)
  function updateProgressBar(idx) {
    const total = sections.length;
    const START = 25;
    const END = 90;
    
    const pct = Math.round(
      START + ((idx + 1) / total) * (END - START)
    );

    const wrap = container.querySelector(".ld-progress");
    const val = container.querySelector(".progress-value");
    const mot = container.querySelector("#coreg-motivation");

    if (wrap) {
    wrap.setAttribute("data-progress", pct);
    if (window.animateProgressBar) {
      window.animateProgressBar(wrap);
    }
  }
  
  if (val) val.textContent = pct + "%";

    if (mot) {
      if (pct < 90) {
        mot.textContent =
          "Nog enkele vragen om je deelname af te ronden 🎯";
      } else {
        mot.textContent =
          "Bijna klaar — laatste stap 🙌";
      }
    }
  }

  function showNextSection(cur) {
    const idx = sections.indexOf(cur);
    if (idx < sections.length - 1) {
      cur.style.display = "none";
      sections[idx + 1].style.display = "block";
      updateProgressBar(idx + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      handleFinalCoreg();
    }
  }

  function handleFinalCoreg() {
    const needLF = sessionStorage.getItem("requiresLongForm") === "true";
    const pending = JSON.parse(sessionStorage.getItem("longFormCampaigns") || "[]");

    const btnLongform = document.getElementById("coreg-longform-btn");
    const btnFinish = document.getElementById("coreg-finish-btn");

    if ((needLF || pending.length) && btnLongform) {
      btnLongform.click();
    } else if (btnFinish) {
      btnFinish.click();
    }
  }

  // Event listeners blijven zoals ze waren (met stille logs)
  sections.forEach(section => {
    const dropdown = section.querySelector(".coreg-dropdown");

    if (dropdown) {
      dropdown.addEventListener("change", async e => {
        const opt = e.target.selectedOptions[0];
        if (!opt.value) return;

        const camp = campaigns.find(c => c.id == dropdown.dataset.campaign);

        sessionStorage.setItem(
          `f_2575_coreg_answer_dropdown_${camp.cid}`,
          opt.value
        );

        const answerValue = {
          answer_value: opt.value,
          cid: opt.dataset.cid,
          sid: opt.dataset.sid
        };

        // ✅ MINIMALE FIX: ook bij dropdowns coreg answer opslaan (zonder payload/lead)
        storeCoregAnswerOnly(camp, answerValue);

        if (camp.requiresLongForm) {
          sessionStorage.setItem("requiresLongForm", "true");
          const pending = JSON.parse(sessionStorage.getItem("longFormCampaigns") || "[]");
          if (!pending.some(p => p.cid === camp.cid))
            pending.push({ cid: camp.cid, sid: camp.sid });
          sessionStorage.setItem("longFormCampaigns", JSON.stringify(pending));

          showNextSection(section);
          return;
        }

        // ⛔ HARD BLOCK — long form campagnes mogen NOOIT direct versturen
        if (camp.requiresLongForm) {
          sessionStorage.setItem("requiresLongForm", "true");
        
          const pending =
            JSON.parse(sessionStorage.getItem("longFormCampaigns") || "[]");
        
          if (!pending.some(p => p.cid === answerValue.cid)) {
            pending.push({
              cid: answerValue.cid,
              sid: answerValue.sid
            });
          }
        
          sessionStorage.setItem("longFormCampaigns", JSON.stringify(pending));
          showNextSection(section);
          return;
        }

        const shortDone =
          sessionStorage.getItem("shortFormCompleted") === "true";
        
        // SHORT FORM COREG — vóór short form → opslaan
        if (!shortDone) {
          const pending =
            JSON.parse(sessionStorage.getItem("pendingShortCoreg") || "[]");
        
          pending.push({
          cid: answerValue.cid || camp.cid,
          sid: answerValue.sid || camp.sid,
          answer_value: answerValue.answer_value
        });
        
          sessionStorage.setItem(
            "pendingShortCoreg",
            JSON.stringify(pending)
          );
        
          showNextSection(section);
          return;
        }
        
        // short form is al gedaan → check multi-step
        const idx = sections.indexOf(section);
        const moreSteps = sections.slice(idx + 1)
          .some(s => s.dataset.cid == camp.cid);
        
        if (moreSteps) {
          showNextSection(section);
          return;
        }
        
        // short form gedaan + laatste stap → direct versturen
        const payload = await buildCoregPayload(camp, answerValue);
        window.fetchLead(payload);
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

section.querySelectorAll(".btn-answer, .btn-skip").forEach(btn => {
  btn.addEventListener("click", async () => {
    const camp = campaigns.find(c => c.id == btn.dataset.campaign);
    const answer = btn.dataset.answer;
    const isNegative =
      btn.classList.contains("btn-skip") ||
      answer === "no";

    const answerValue = {
      answer_value: answer,
      cid: btn.dataset.cid,
      sid: btn.dataset.sid
    };

    // ============================
    // POSITIEF ANTWOORD
    // ============================
    if (!isNegative) {
      const shortDone =
        sessionStorage.getItem("shortFormCompleted") === "true";

      // 🔑 ALTIJD antwoord opslaan (nooit vergeten)
      storeCoregAnswerOnly(camp, answerValue);

      // ----------------------------
      // LONG FORM COREG
      // ----------------------------
      if (camp.requiresLongForm) {
        sessionStorage.setItem("requiresLongForm", "true");

        const pending =
          JSON.parse(sessionStorage.getItem("longFormCampaigns") || "[]");

        if (!pending.some(p => p.cid === camp.cid)) {
          pending.push({ cid: camp.cid, sid: camp.sid });
        }

        sessionStorage.setItem(
          "longFormCampaigns",
          JSON.stringify(pending)
        );

        showNextSection(section);
        return;
      }

      // ----------------------------
      // SHORT FORM COREG (DEFAULT)
      // ----------------------------
      if (!shortDone) {
        const pending =
          JSON.parse(sessionStorage.getItem("pendingShortCoreg") || "[]");

      pending.push({
        cid: answerValue.cid || camp.cid,
        sid: answerValue.sid || camp.sid,
        answer_value: answerValue.answer_value
      });

        sessionStorage.setItem(
          "pendingShortCoreg",
          JSON.stringify(pending)
        );

        showNextSection(section);
        return;
      }

      // short form al gedaan → direct versturen
      const payload = await buildCoregPayload(camp, answerValue);
      window.fetchLead(payload);
      showNextSection(section);
      return;
    }

    // ============================
    // NEGATIEF ANTWOORD
    // ============================
    const idx = sections.indexOf(section);
    let j = idx + 1;

    while (j < sections.length && sections[j].dataset.cid == camp.cid) j++;

    section.style.display = "none";

    if (j < sections.length) {
      sections[j].style.display = "block";
      updateProgressBar(j);
    } else {
      handleFinalCoreg();
    }
    });
  });
});

}
  
// ======================================
// Start renderer + nette eindmelding
// ======================================
window.addEventListener("DOMContentLoaded", initCoregFlow);

if (!DEBUG) console.info("🎉 coregRenderer loaded successfully");
