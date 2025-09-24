export function renderCoregCampaign(campaignId, data) {
  if (!data) return "";

  if (data.type === "single") {
    return `
      <div class="coreg-section" id="${campaignId}">
        <h3>${data.title}</h3>
        <p>${data.description}</p>
        <div class="button-group">
          ${data.positiveAnswers.map(a => `
            <button class="flow-next sponsor-optin" id="${campaignId}">
              ${a}
            </button>
          `).join("")}
          <button class="flow-next">Sla over, geen interesse</button>
        </div>
      </div>
    `;
  }

  if (data.type === "dropdown") {
    return `
      <div class="coreg-section" id="${campaignId}">
        <h3>${data.title}</h3>
        <p>${data.description}</p>
        <div class="form-group">
          <select data-dropdown-campaign="${campaignId}" required>
            <option value="">Maak een keuze</option>
            ${data.options.map(o => `<option value="${o.value}">${o.label}</option>`).join("")}
          </select>
        </div>
        <button class="flow-next">Ga verder</button>
      </div>
    `;
  }

  if (data.type === "multistep") {
    return `
      <!-- Stap 1 -->
      <div class="coreg-section" id="${campaignId}-step1">
        <h3>${data.step1.title}</h3>
        <p>${data.step1.description}</p>
        <div class="button-group">
          <button class="flow-next sponsor-next next-step-${campaignId}-step2">
            ${data.step1.positiveText}
          </button>
          <button class="flow-next">${data.step1.negativeText}</button>
        </div>
      </div>
      <!-- Stap 2 -->
      <div class="coreg-section" id="${campaignId}-step2" style="display:none;">
        <h3>${data.step2.title}</h3>
        <p>${data.step2.description}</p>
        <div class="form-group">
          <select data-dropdown-campaign="${campaignId}" required>
            <option value="">Maak een keuze</option>
            ${data.step2.options.map(o => `<option value="${o.value}">${o.label}</option>`).join("")}
          </select>
        </div>
        <button class="flow-next">Bevestigen</button>
      </div>
    `;
  }

  return "";
}
