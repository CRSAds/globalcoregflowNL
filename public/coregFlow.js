// coregFlow.js
// Alles in 1 bestand zodat het direct in Swipe Pages werkt

const sponsorCampaigns = {
  "campaign-nationale-kranten": {
    type: "single",
    title: "Welke is jouw favoriet?",
    description:
      "Geef hieronder aan van welke krant jij graag dagelijks per e-mail de nieuwsbrief zou willen ontvangen.",
    positiveAnswers: [
      "Ja, De Volkskrant",
      "Ja, Algemeen Dagblad",
      "Ja, Trouw",
      "Ja, Het Parool"
    ],
    coregAnswerKey: "coreg_answer_campaign-nationale-kranten",
    cid: 3534,
    sid: 34
  },

  "campaign-regionale-kranten": {
    type: "dropdown",
    title: "Welke regionale krant wil je ontvangen?",
    description:
      "Kies jouw favoriete regionale krant en ontvang dagelijks de nieuwsbrief per e-mail.",
    options: [
      { value: "brabants", label: "Brabants Dagblad" },
      { value: "tubantia", label: "Tubantia" },
      { value: "pzc", label: "PZC" },
      { value: "gelderlander", label: "De Gelderlander" }
    ],
    answerFieldKey: "f_2575_coreg_answer_dropdown",
    coregAnswerKey: "coreg_answer_campaign-regionale-kranten",
    cid: 4196,
    sid: 34
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
    coregAnswerKey: "coreg_answer_campaign-trefzeker",
    answerFieldKey: "f_2575_coreg_answer_dropdown",
    cid: 5017,
    sid: 496,
    hasCoregFlow: true
  }
};

function renderCoregCampaign(campaignId, data, isFinal = false) {
  const finalClass = isFinal ? " final-coreg" : "";

  if (data.type === "single") {
    return `
      <div class="coreg-section${finalClass}" id="${campaignId}">
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
        <h3>${data.title}</h3>
        <p>${data.description}</p>
        <div class="form-group">
          <select data-dropdown-campaign="${campaignId}" required>
            <option value="">Maak een keuze</option>
            ${data.options
              .map(o => `<option value="${o.value}">${o.label}</option>`)
              .join("")}
          </select>
        </div>
        <button class="flow-next sponsor-optin" id="${campaignId}">Ga verder</button>
      </div>
    `;
  }

  if (data.type === "multistep") {
    return `
      <!-- Stap 1 -->
      <div class="coreg-section" id="${campaignId}-step1">
        <h3>${data.step1.title}</h3>
        <p>${data.step1.description}</p>
        <button class="flow-next sponsor-next next-step-${campaignId}-step2" id="${campaignId}">
          ${data.step1.positiveText}
        </button>
        <button class="flow-next skip-next">${data.step1.negativeText}</button>
      </div>
      <!-- Stap 2 -->
      <div class="coreg-section${finalClass}" id="${campaignId}-step2">
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

window.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("coreg-container");
  if (!container) return;

  const ids = Object.keys(sponsorCampaigns);
  ids.forEach((id, i) => {
    const isFinal = i === ids.length - 1;
    container.innerHTML += renderCoregCampaign(id, sponsorCampaigns[id], isFinal);
  });
});
