// coregFlow.js
// Alle coreg campagnes + rendering + flow logica in één bestand

const sponsorCampaigns = {
  "campaign-nationale-kranten": {
    type: "single",
    title: "Welke is jouw favoriet?",
    description:
      "Geef hieronder aan van welke krant jij graag dagelijks per e-mail de nieuwsbrief zou willen ontvangen.",
    image: "/images/nationale-kranten.png",
    positiveAnswers: [
      "Ja, De Volkskrant",
      "Ja, Algemeen Dagblad",
      "Ja, Trouw",
      "Ja, Het Parool"
    ],
    cid: 3534,
    sid: 34,
    coregAnswerKey: "coreg_answer_campaign-nationale-kranten"
  },

  "campaign-regionale-kranten": {
    type: "dropdown",
    title: "Welke regionale krant wil je ontvangen?",
    description:
      "Kies jouw favoriete regionale krant en ontvang dagelijks de nieuwsbrief per e-mail.",
    image: "/images/regionale-kranten.png",
    options: [
      { value: "brabants", label: "Brabants Dagblad" },
      { value: "tubantia", label: "Tubantia" },
      { value: "pzc", label: "PZC" },
      { value: "gelderlander", label: "De Gelderlander" }
    ],
    cid: 4196,
    sid: 34,
    coregAnswerKey: "coreg_answer_campaign-regionale-kranten",
    answerFieldKey: "f_2575_coreg_answer_dropdown"
  },

  "campaign-trefzeker": {
    type: "multistep",
    step1: {
      title: "Wil je een energieaanbod ontvangen?",
      description:
        "Onze partner Trefzeker helpt je graag met het vergelijken van energietarieven.",
      positiveText: "Ja, ik wil een aanbod",
      negativeText: "Nee, geen interesse"
    },
    step2: {
      title: "Wie is je huidige energieleverancier?",
      description: "Selecteer hieronder je huidige leverancier.",
      options: [
        { value: "essent", label: "Essent" },
        { value: "vandebron", label: "Van de Bron" },
        { value: "budget", label: "Budget Energie" }
      ]
    },
    image: "/images/trefzeker.png",
    cid: 5017,
    sid: 496,
    coregAnswerKey: "coreg_answer_campaign-trefzeker",
    answerFieldKey: "f_2575_coreg_answer_dropdown",
    hasCoregFlow: true
  },

  "campaign-kiosk": {
    type: "single",
    title: "Ontvang jij graag acties van Kiosk?",
    description: "Kiosk biedt kortingen op tijdschriften en kranten.",
    image: "/images/kiosk.png",
    positiveAnswers: ["Ja, ik wil acties ontvangen"],
    cid: 6001,
    sid: 34,
    coregAnswerKey: "coreg_answer_campaign-kiosk"
  },

  "campaign-generationzero": {
    type: "single",
    title: "Wil je meer weten over Generation Zero?",
    description: "Ontvang updates en exclusieve content.",
    image: "/images/generationzero.png",
    positiveAnswers: ["Ja, ik wil informatie ontvangen"],
    cid: 6002,
    sid: 34,
    coregAnswerKey: "coreg_answer_campaign-generationzero"
  },

  "campaign-mycollections": {
    type: "single",
    title: "Spaar jij graag mee met Mycollections?",
    description: "Ontvang exclusieve acties en aanbiedingen.",
    image: "/images/mycollections.png",
    positiveAnswers: ["Ja, ik doe graag mee"],
    cid: 6003,
    sid: 34,
    coregAnswerKey: "coreg_answer_campaign-mycollections",
    requiresLongForm: true
  },

  "campaign-raadselgids": {
    type: "dropdown",
    title: "Welke Raadselgids wil je ontvangen?",
    description: "Kies jouw favoriete uitgave en ontvang aanbiedingen.",
    image: "/images/raadselgids.png",
    options: [
      { value: "puzzelmix", label: "Puzzelmix" },
      { value: "sudoku", label: "Sudoku" },
      { value: "kruiswoord", label: "Kruiswoord" }
    ],
    cid: 6004,
    sid: 34,
    coregAnswerKey: "coreg_answer_campaign-raadselgids",
    answerFieldKey: "f_2575_coreg_answer_dropdown",
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
            ${data.options
              .map(o => `<option value="${o.value}">${o.label}</option>`)
              .join("")}
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
          ${data.step2.options
            .map(o => `<option value="${o.value}">${o.label}</option>`)
            .join("")}
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

          // Als dit de laatste campagne is → finish-btn triggeren
          if (idx >= sections.length - 2 && section.classList.contains("final-coreg") === false) {
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
