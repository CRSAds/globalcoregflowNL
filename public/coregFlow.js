// coregFlow.js
// Alle coreg campagnes + rendering + flow logica (met fixes)

const sponsorCampaigns = {
  "campaign-nationale-kranten": {
    type: "single",
    title: "Welke is jouw favoriet?",
    description:
      "Geef hieronder aan van welke krant jij graag dagelijks per e-mail de nieuwsbrief zou willen ontvangen.",
    image: "https://globalcoregflow-nl.vercel.app/images/Nationale-Kranten.png",
    positiveAnswers: ["De Volkskrant", "Algemeen Dagblad", "Trouw", "Het Parool"],
    cid: 3534,
    sid: 34,
    coregAnswerKey: "coreg_answer_campaign-nationale-kranten"
  },

  "campaign-regionale-kranten": {
    type: "dropdown",
    title: "Jouw regio, Jouw nieuws!",
    description:
      "Ontvang dagelijks de belangrijkste updates uit jouw omgeving rechtstreeks in je inbox.<br><b>Kies je favoriet</b> en blijf altijd op de hoogte van wat er speelt.",
    image: "https://globalcoregflow-nl.vercel.app/images/Regionale-Kranten.png", // pas aan indien nodig
    options: [
      { value: "de-stentor", label: "de Stentor" },
      { value: "bn-destem", label: "BN DeStem" },
      { value: "de-gelderlander", label: "de Gelderlander" },
      { value: "brabants-dagblad", label: "Brabants Dagblad" },
      { value: "tubantia", label: "Tubantia" },
      { value: "eindhovens-dagblad", label: "Eindhovens Dagblad" },
      { value: "pzc", label: "PZC" }
    ],
    cid: 4196,
    sid: 34,
    coregAnswerKey: "coreg_answer_campaign-regionale-kranten",
    answerFieldKey: "f_2575_coreg_answer_dropdown"
  },

  "campaign-trefzeker": {
    type: "multistep",
    step1: {
      title: "Betaal jij nog te veel voor je energierekening?",
      description:
        "Stop met te veel betalen! Met onze gratis check kun je direct beginnen met besparen op jouw energierekening. Mogen wij jou vrijblijvend bellen voor de bespaar check?",
      positiveText: "Ja, graag",
      negativeText: "Sla over, geen interesse"
    },
    step2: {
      title: "Wie is je huidige energieleverancier?",
      description: "Selecteer hieronder je huidige leverancier.",
      options: [
        { value: "Vattenfall", label: "Vattenfall" },
        { value: "Essent", label: "Essent" },
        { value: "Eneco", label: "Eneco" },
        { value: "Budget Energie", label: "Budget Energie" },
        { value: "Greenchoice", label: "Greenchoice" },
        { value: "ENGIE", label: "ENGIE" },
        { value: "Oxxio", label: "Oxxio" },
        { value: "Pure Energie", label: "Pure Energie" },
        { value: "Vandebron", label: "Vandebron" },
        { value: "Delta", label: "Delta" },
        { value: "Anders", label: "Anders" }
      ]
    },
    image: "https://globalcoregflow-nl.vercel.app/images/Trefzeker%20Prijzen%20Coreg.png",
    cid: 5017,
    sid: 496,
    coregAnswerKey: "coreg_answer_campaign-trefzeker",
    answerFieldKey: "f_2575_coreg_answer_dropdown",
    hasCoregFlow: true,
    requiresLongForm: true // TM
  },

  "campaign-kiosk": {
    type: "single",
    title: "Lees alle bladen voordeliger",
    description:
      "Ontvang 2x per maand per email gratis de Kiosk.nl nieuwsbrief met daarin de leukste artikelen, aanbiedingen en prijsvragen. Wil je onze nieuwsbrief ontvangen?",
    image: "https://globalcoregflow-nl.vercel.app/images/Kiosk%20Banner.webp",
    positiveAnswers: ["Ja, leuk"],
    cid: 6001,
    sid: 34,
    coregAnswerKey: "coreg_answer_campaign-kiosk"
  },

  "campaign-generationzero": {
    type: "single",
    title: "Wil je meer weten over Generation Zero?",
    description: "Ontvang updates en exclusieve content over Generation Zero.",
    image: "https://globalcoregflow-nl.vercel.app/images/GenZero%20Coreg.png",
    positiveAnswers: ["Ja, ik wil informatie ontvangen"],
    cid: 6002,
    sid: 34,
    coregAnswerKey: "coreg_answer_campaign-generationzero",
    requiresLongForm: true // TM
  },

  "campaign-mycollections": {
    type: "single",
    title: "Wat spreekt u het meest aan?",
    description:
      "Ontdek My Collections: exclusieve verzamelingen met een gratis cadeau. Interesse in een telefonisch aanbod? Zo ja, wat is uw favoriete categorie?",
    image: "https://globalcoregflow-nl.vercel.app/images/MyCollections%20Banner.webp",
    positiveAnswers: ["Topboeken", "Kookboeken", "Romans", "Kristallen beeldjes"],
    cid: 1882,
    sid: 34,
    coregAnswerKey: "coreg_answer_campaign-mycollections",
    requiresLongForm: true // TM
  },

  "campaign-raadselgids": {
    type: "single",
    title: "Wil jij een Gratis Puzzelboek?",
    description:
      "Mag Raadselgids jou eenmalig bellen met een leuk puzzelaanbod? Los puzzels op, verdien punten en ruil in voor mooie prijzen!",
    image: "https://globalcoregflow-nl.vercel.app/images/raadselgids.png",
    positiveAnswers: ["Ja, graag"],
    cid: 4621,
    sid: 34,
    coregAnswerKey: "coreg_answer_campaign-raadselgids",
    requiresLongForm: true // TM
  }
};

/* ---------- helpers to persist answers (compatible with your existing checks) ---------- */
function markAnswer(campaignId, isPositive, value) {
  // JA / NEE voor deze campagne
  sessionStorage.setItem(`coreg_answer_${campaignId}`, isPositive ? "yes" : "no");
  if (value !== undefined) {
    sessionStorage.setItem(`coreg_value_${campaignId}`, value);
  }
  // flag voor TM-positief (gebruik je evt. in je eigen check)
  const cfg = sponsorCampaigns[campaignId];
  if (isPositive && cfg && cfg.requiresLongForm) {
    sessionStorage.setItem("has_tm_positive", "1");
  }
}

/* ---------- renderer ---------- */
function renderCoregCampaign(campaignId, data, isFinal = false) {
  const finalClass = isFinal ? " final-coreg" : "";

  if (data.type === "single") {
    return `
      <div class="coreg-section${finalClass}" id="${campaignId}">
        <img src="${data.image}" alt="${data.title}" class="coreg-image" />
        <h3>${data.title}</h3>
        <p>${data.description}</p>
        <div class="button-group">
          ${data.positiveAnswers
            .map(a => `<button class="flow-next sponsor-optin" id="${campaignId}">${a}</button>`)
            .join("")}
          <button class="flow-next skip-btn" data-campaign="${campaignId}">Sla over, geen interesse</button>
        </div>
      </div>
    `;
  }

  if (data.type === "dropdown") {
    return `
      <div class="coreg-section${finalClass}" id="${campaignId}">
        <img src="${data.image}" alt="${data.title}" class="coreg-image" />
        <h3>${data.title}</h3>
        <p>${data.description}</p>
        <div class="form-group">
          <select data-dropdown-campaign="${campaignId}" class="coreg-dropdown" required>
            <option value="">Maak een keuze</option>
            ${data.options.map(o => `<option value="${o.value}">${o.label}</option>`).join("")}
          </select>
        </div>
        <a href="#" class="skip-link" data-campaign="${campaignId}">Geen interesse, sla over</a>
      </div>
    `;
  }

  if (data.type === "multistep") {
    return `
      <!-- Stap 1 -->
      <div class="coreg-section" id="${campaignId}-step1">
        <img src="${data.image}" alt="${data.step1.title}" class="coreg-image" />
        <h3>${data.step1.title}</h3>
        <p>${data.step1.description}</p>
        <button class="flow-next sponsor-next next-step-${campaignId}-step2" id="${campaignId}">
          ${data.step1.positiveText}
        </button>
        <button class="flow-next skip-next" data-campaign="${campaignId}">
          ${data.step1.negativeText}
        </button>
      </div>
      <!-- Stap 2 (dropdown auto-advance + skip-link) -->
      <div class="coreg-section${finalClass}" id="${campaignId}-step2">
        <img src="${data.image}" alt="${data.step2.title}" class="coreg-image" />
        <h3>${data.step2.title}</h3>
        <p>${data.step2.description}</p>
        <div class="form-group">
          <select data-dropdown-campaign="${campaignId}" class="coreg-dropdown" required>
            <option value="">Kies uw huidige energieleverancier...</option>
            ${data.step2.options.map(o => `<option value="${o.value}">${o.label}</option>`).join("")}
          </select>
        </div>
        <a href="#" class="skip-link" data-campaign="${campaignId}">Sla over, toch geen interesse</a>
      </div>
    `;
  }

  return "";
}

/* ---------- flow ---------- */
function initCoregFlow() {
  const container = document.getElementById("coreg-container");
  if (!container) return;

  const ids = Object.keys(sponsorCampaigns);
  ids.forEach((id, i) => {
    const isFinal = i === ids.length - 1;
    container.innerHTML += renderCoregCampaign(id, sponsorCampaigns[id], isFinal);
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
  // Check TM antwoorden
  let hasTmPositive = false;
  Object.keys(sponsorCampaigns).forEach(id => {
    const camp = sponsorCampaigns[id];
    const answer = sessionStorage.getItem(`coreg_answer_${id}`);
    if (camp.requiresLongForm && answer === "yes") {
      hasTmPositive = true;
    }
  });

  const longForm = document.getElementById("long-form-section");
  if (longForm) {
    current.style.display = "none";

    if (hasTmPositive) {
      longForm.style.display = "block";
    } else {
      longForm.style.display = "none";
      const allSteps = Array.from(document.querySelectorAll(".flow-section, .coreg-section"));
      const longIdx = allSteps.indexOf(longForm);
      if (longIdx > -1 && allSteps[longIdx + 1]) {
        allSteps[longIdx + 1].style.display = "block";
      }
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

  sections.forEach(section => {
    // SINGLE: JA en SLA OVER knoppen
    section.querySelectorAll(".sponsor-optin").forEach(btn => {
      btn.addEventListener("click", () => {
        const campaignId = btn.id;
        markAnswer(campaignId, true);
        showNextSection(section);
      });
    });
    section.querySelectorAll(".skip-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const campaignId = btn.getAttribute("data-campaign");
        markAnswer(campaignId, false);
        showNextSection(section);
      });
    });

    // DROPDOWN: keuze = direct door, plus skip-link
    const dropdown = section.querySelector(".coreg-dropdown");
    if (dropdown) {
      const campaignId = dropdown.getAttribute("data-dropdown-campaign");
      dropdown.addEventListener("change", () => {
        if (dropdown.value !== "") {
          markAnswer(campaignId, true, dropdown.value);
          showNextSection(section);
        }
      });
    }
    const skipLink = section.querySelector(".skip-link");
    if (skipLink) {
      skipLink.addEventListener("click", e => {
        e.preventDefault();
        const campaignId = skipLink.getAttribute("data-campaign");
        markAnswer(campaignId, false);
        showNextSection(section);
      });
    }

    // MULTISTEP: stap 1 ja/nee
    section.querySelectorAll(".sponsor-next").forEach(btn => {
      btn.addEventListener("click", () => {
        const campaignId = btn.id;
        markAnswer(campaignId, true); // TM positief al bij stap 1
        const classes = Array.from(btn.classList);
        const nextStepClass = classes.find(c => c.startsWith("next-step-"));
        if (nextStepClass) {
          const nextId = nextStepClass.replace("next-step-", "");
          section.style.display = "none";
          const nextSection = document.getElementById(nextId);
          if (nextSection) {
            nextSection.style.display = "block";
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }
      });
    });

    section.querySelectorAll(".skip-next").forEach(btn => {
      btn.addEventListener("click", () => {
        const campaignId = btn.getAttribute("data-campaign");
        markAnswer(campaignId, false);

        const idx = sections.indexOf(section);
        section.style.display = "none";

        // Als dit de voorlaatste sectie was (stap1 van laatste multistep), dan zouden we stap2 overslaan en klaar zijn
        if (idx >= sections.length - 2) {
          const finishBtn = document.getElementById("coreg-finish-btn");
          if (finishBtn) finishBtn.click();
        } else if (sections[idx + 2]) {
          sections[idx + 2].style.display = "block"; // skip stap 2
        }

        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
  });
}

window.addEventListener("DOMContentLoaded", initCoregFlow);
