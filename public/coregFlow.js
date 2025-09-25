// coregFlow.js
// Alle coreg campagnes + rendering + flow logica

const sponsorCampaigns = {
  "campaign-nationale-kranten": {
    type: "single",
    title: "Welke is jouw favoriet?",
    description:
      "Geef hieronder aan van welke krant jij graag dagelijks per e-mail de nieuwsbrief zou willen ontvangen.",
    image: "https://globalcoregflow-nl.vercel.app/images/Nationale-Kranten.png",
    positiveAnswers: [
      "De Volkskrant",
      "Algemeen Dagblad",
      "Trouw",
      "Het Parool"
    ],
    cid: 3534,
    sid: 34,
    coregAnswerKey: "coreg_answer_campaign-nationale-kranten"
  },

  "campaign-regionale-kranten": {
    type: "dropdown",
    title: "Jouw regio, Jouw nieuws!",
    description:
      "Ontvang dagelijks de belangrijkste updates uit jouw omgeving rechtstreeks in je inbox.<br><b>Kies je favoriet</b> en blijf altijd op de hoogte van wat er speelt.",
    image: "https://globalcoregflow-nl.vercel.app/images/Nationale-Kranten.png",
    options: [], // opties vul jij zelf in
    cid: 4196,
    sid: 34,
    coregAnswerKey: "coreg_answer_campaign-regionale-kranten",
    answerFieldKey: "f_2575_coreg_answer_dropdown"
  },

  "campaign-trefzeker": {
    type: "multistep",
    step1: {
      title: "Betaal jij nog te veel voor je energie rekening?",
      description:
        "Stop met te veel betalen! Met onze gratis check kun je direct beginnen met besparen op jouw energie rekening. Mogen wij jou vrijblijvend bellen voor de bespaar check?",
      positiveText: "Ja, graag",
      negativeText: "Sla over, geen interesse"
    },
    step2: {
      title: "Wie is je huidige energieleverancier?",
      description: "Selecteer hieronder je huidige leverancier.",
      options: [] // dropdown opties vul jij zelf in
    },
    image: "https://globalcoregflow-nl.vercel.app/images/images/Trefzeker Prijzen Coreg.png",
    cid: 5017,
    sid: 496,
    coregAnswerKey: "coreg_answer_campaign-trefzeker",
    answerFieldKey: "f_2575_coreg_answer_dropdown",
    hasCoregFlow: true
  },

  "campaign-kiosk": {
    type: "single",
    title: "Lees alle bladen voordeliger",
    description:
      "Ontvang 2x per maand per email gratis de Kiosk.nl nieuwsbrief met daarin de leukste artikelen, aanbiedingen en prijsvragen. Wil je onze nieuwsbrief ontvangen?",
    image: "https://globalcoregflow-nl.vercel.app/images/images/kiosk.png",
    positiveAnswers: ["Ja, leuk"],
    cid: 6001,
    sid: 34,
    coregAnswerKey: "coreg_answer_campaign-kiosk"
  },

  "campaign-generationzero": {
    type: "single",
    title: "Wil je meer weten over Generation Zero?",
    description:
      "Ontvang updates en exclusieve content over Generation Zero.",
    image: "https://globalcoregflow-nl.vercel.app/images/images/generationzero.png",
    positiveAnswers: ["Ja, ik wil informatie ontvangen"],
    cid: 6002,
    sid: 34,
    coregAnswerKey: "coreg_answer_campaign-generationzero"
  },

  "campaign-mycollections": {
    type: "single",
    title: "Wat spreekt u het meest aan?",
    description:
      "Ontdek My Collections: exclusieve verzamelingen met een gratis cadeau. Interesse in een telefonisch aanbod? Zo ja, wat is uw favoriete categorie?",
    image: "https://globalcoregflow-nl.vercel.app/images/images/mycollections.png",
    positiveAnswers: [
      "Ja, topboeken",
      "Ja, kookboeken",
      "Ja, romans",
      "Ja, kristallen beeldjes"
    ],
    cid: 1882,
    sid: 34,
    coregAnswerKey: "coreg_answer_campaign-mycollections",
    requiresLongForm: true
  },

  "campaign-raadselgids": {
    type: "single",
    title: "Wil jij een Gratis Puzzelboek?",
    description:
      "Mag Raadselgids jou eenmalig bellen met een leuk puzzelaanbod? Los puzzels op, verdien punten en ruil in voor mooie prijzen!",
    image: "https://globalcoregflow-nl.vercel.app/images/images/raadselgids.png",
    positiveAnswers: ["Ja, graag"],
    cid: 4621,
    sid: 34,
    coregAnswerKey: "coreg_answer_campaign-raadselgids",
    requiresLongForm: true
  }
};

// ============== Renderer ==============

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
            .map(
              a =>
                `<button class="flow-next sponsor-optin" id="${campaignId}">${a}</button>`
            )
            .join("")}
          <button class="flow-next">Sla over, geen interesse</button>
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
        <a href="#" class="skip-link">Geen interesse, sla over</a>
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
        <button class="flow-next skip-next">${data.step1.negativeText}</button>
      </div>
      <!-- Stap 2 -->
      <div class="coreg-section${finalClass}" id="${campaignId}-step2">
        <img src="${data.image}" alt="${data.step2.title}" class="coreg-image" />
        <h3>${data.step2.title}</h3>
        <p>${data.step2.description}</p>
        <select data-dropdown-campaign="${campaignId}" required>
          <option value="">Maak een keuze</option>
          ${data.step2.options.map(o => `<option value="${o.value}">${o.label}</option>`).join("")}
        </select>
        <button class="flow-next sponsor-optin" id="${campaignId}">Bevestigen</button>
      </div>
    `;
  }

  return "";
}

// ============== Flow logica ==============

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
      // Laatste coreg → trigger verborgen button
      const finishBtn = document.getElementById("coreg-finish-btn");
      if (finishBtn) finishBtn.click();
    }
  }

  sections.forEach(section => {
    // Dropdown onchange = direct door
    const dropdown = section.querySelector(".coreg-dropdown");
    if (dropdown) {
      dropdown.addEventListener("change", () => {
        if (dropdown.value !== "") {
          showNextSection(section);
        }
      });
    }

    // Skip link bij dropdown
    const skipLink = section.querySelector(".skip-link");
    if (skipLink) {
      skipLink.addEventListener("click", e => {
        e.preventDefault();
        showNextSection(section);
      });
    }

    section.querySelectorAll(".flow-next").forEach(btn => {
      btn.addEventListener("click", () => {
        // Multistep JA
        if (btn.classList.contains("sponsor-next")) {
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
            return;
          }
        }

        // Multistep NEE
        if (btn.classList.contains("skip-next")) {
          const idx = sections.indexOf(section);
          section.style.display = "none";

          // Als laatste campagne → trigger finish-btn
          if (idx >= sections.length - 2) {
            const finishBtn = document.getElementById("coreg-finish-btn");
            if (finishBtn) finishBtn.click();
          } else {
            if (sections[idx + 2]) {
              sections[idx + 2].style.display = "block";
            }
          }

          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }

        // Normaal gedrag
        showNextSection(section);
      });
    });
  });
}

window.addEventListener("DOMContentLoaded", initCoregFlow);
