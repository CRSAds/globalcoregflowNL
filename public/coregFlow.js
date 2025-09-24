// coregFlow.js
import sponsorCampaigns from "./sponsorCampaigns.js";

function renderCoregCampaign(campaignId, data, isFinal = false) {
  const finalClass = isFinal ? " final-coreg" : "";

  if (data.type === "single") {
    return `
      <div class="coreg-section${finalClass}" id="${campaignId}">
        <h3>${data.title}</h3>
        <p>${data.description}</p>
        <div class="button-group">
          ${data.positiveAnswers.map(a => `
            <button class="flow-next sponsor-optin" id="${campaignId}">${a}</button>
          `).join("")}
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
            ${data.options.map(o => `<option value="${o.value}">${o.label}</option>`).join("")}
          </select>
        </div>
        <button class="flow-next sponsor-optin" id="${campaignId}">Ga verder</button>
      </div>
    `;
  }

  if (data.type === "multistep") {
    return `
      <div class="coreg-section" id="${campaignId}-step1">
        <h3>${data.step1.title}</h3>
        <p>${data.step1.description}</p>
        <button class="flow-next sponsor-next next-step-${campaignId}-step2" id="${campaignId}">
          ${data.step1.positiveText}
        </button>
        <button class="flow-next skip-next">${data.step1.negativeText}</button>
      </div>
      <div class="coreg-section${finalClass}" id="${campaignId}-step2">
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

window.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("coreg-container");
  if (!container) return;

  const ids = Object.keys(sponsorCampaigns);
  ids.forEach((id, i) => {
    const isFinal = i === ids.length - 1;
    container.innerHTML += renderCoregCampaign(id, sponsorCampaigns[id], isFinal);
  });
});
